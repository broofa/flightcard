/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:<port>/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

/**
 * Coudflare worker for fetching, parsing, and caching the list of Tripoli
 * members available at MEMBERS_URL (below).
 */

const TRA_MEMBERS_LIST = 'https://tripoli.org/docs.ashx?id=916333';
const NAR_MEMBERS_FORM =
  'https://www.nar.org/high-power-rocketry-info/hpr-cert-search/';
const BUCKET_SIZE = 1000;
const DOMAIN_WHITELIST = /\.flightcard\.org$|^localhost$/;

// Tripoli uses some special codes for their cert levels, which we need to map
// to the expected 0-3 values.
const TRIPOLI_CERT_MAP: Record<string, string> = {
  // "Exam required" - Member's dues are paid, but they need to retake L2 exam
  // to reinstate their L2/L3 cert
  '3ER': '1',
  '2ER': '1',

  // Mentor L1
  M1: '1',

  // Same thing as M1???
  M: '1',
};

export interface Env {
  ClubMembers: KVNamespace;
}

class HTTPError extends Error {
  constructor(public message: string, public statusCode = 500) {
    super(message);
  }
}

// Cert types (copy from types.ts#iCert)
export type Timestamp = number;
export enum CertLevel {
  NONE = 0,
  L1 = 1,
  L2 = 2,
  L3 = 3,
}
export enum CertOrg {
  NAR = 'NAR',
  TRA = 'TRA',
}
export interface iCert {
  level: CertLevel;
  firstName?: string;
  lastName?: string;
  organization?: CertOrg;
  memberId?: number;
  expires?: Timestamp;

  verifiedId?: string; // Id of attendee that verified the ID
  verifiedTime?: Timestamp;
}

type CertGroup = Record<string, iCert>;

function isCertInfo(cert?: iCert): cert is iCert {
  return !!cert?.memberId;
}

export default {
  // Handle HTTP requests to this worker.  We have a bit of boiler-late code
  // here to ensure we always return a JSON response with proper CORS headers
  async fetch(
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    env: Env,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: ExecutionContext
  ): Promise<Response> {
    // Compose response headers.  Use CORS to restrict to development and
    // production environments
    const origin = request.headers.get('origin') ?? 'invalid://';
    const { hostname } = new URL(origin);
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'access-control-allow-origin': DOMAIN_WHITELIST.test(hostname)
        ? origin
        : '',
    };

    // Invoke handler.  We wrap this in some basic boilerplate to insure we
    // _always_ return a JSON response, and to make error handling simple and
    // robust.
    try {
      const body = await handleRequest(request, env);
      return new Response(JSON.stringify(body, null, 2), { headers });
    } catch (err) {
      const { message, statusCode, stack } = err as HTTPError;
      return new Response(
        JSON.stringify({
          error: message,
          stack: statusCode ? undefined : stack?.split(/\n/g),
        }),
        {
          status: statusCode ?? 500,
          headers,
        }
      );
    }
  },

  // Handle scheduled invocations
  //
  // NOTE: This can be triggered in dev by hitting  http://localhost:8787/cdn-cgi/mf/scheduled

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(updateTripoliKV(env));
  },
};

// fetch the members list from the source and parse it
async function fetchTripoliCerts() {
  const resp = await fetch(TRA_MEMBERS_LIST);
  const csv = await resp.text();

  // Map lines => member structs
  const lines = csv.split('\n');
  const certs = lines.map((line): iCert | undefined => {
    // Parse CSV line, removing trailing quotes
    // TODO: This'll break if there are commas in the field values
    const fields = line.match(/"[^"]+"/g)?.map(v => v.replaceAll('"', ''));

    if (!fields) return;

    // Skip header rows (any row with a non-parsable id field
    if (!/^\d+$/.test(fields[0])) return;

    const [lastName, firstName] = fields[1].split(/,\s*/g);

    return {
      memberId: parseInt(fields[0]),
      firstName,
      lastName,
      level: parseInt(TRIPOLI_CERT_MAP[fields[2]] ?? fields[2]),
      expires: Date.parse(fields[3] + ' PST'),
      organization: CertOrg.TRA,
    };
  });

  return certs.filter(isCertInfo);
}

async function updateTripoliKV(env: Env) {
  const certs = await fetchTripoliCerts();
  const groups: Record<string, CertGroup> = {};

  // Record the last update time (attempt)
  await env.ClubMembers.put('lastUpdate', JSON.stringify(Date.now()));

  // Group certs into buckets
  for (const cert of certs) {
    const { memberId } = cert;

    if (memberId == null) continue;
    const key = Math.floor(memberId / BUCKET_SIZE);
    if (!groups[key]) groups[key] = {};
    groups[key][memberId] = cert;
  }

  // Save each bucket into KV
  //
  //  NOTE: CF limits free plan to 1,000 writes per day, which is why we do this in buckets
  await Promise.allSettled(
    Object.entries(groups).map(([k, v]) => {
      return env.ClubMembers.put(String(k), JSON.stringify(v));
    })
  );
}

async function fetchNAR(
  memberId: number,
  env: Env
): Promise<iCert | undefined> {
  const fd = new FormData();
  fd.set('nar_number', String(memberId));
  const resp = await fetch(NAR_MEMBERS_FORM, { method: 'POST', body: fd });

  if (!resp.ok) {
    throw new HTTPError('Error querying NAR DB', 502);
  }

  const text = await resp.text();
  if (text.includes('NAR # Not Found')) {
    return;
  }

  // Really, really crude HTML scraping here.  We could use Cheerio, but that's
  // a pretty heavy dependency to add, and this is working for now.
  //
  // P.S.  If you're from NAR, trying to figure out how to deliberately break
  // this code just... really?!?  I've emailed you guys to see about doing this
  // is in a way that works better for you, me, your members... but have *never*
  // gotten any response from you.  So here we are, writing shitty HTML scraping
  // code, just to make your member's lives a little better.
  const table = text.match(/<table>(.*)<\/table>/i)?.[1];
  if (!table) {
    throw new HTTPError('No TABLE in NAR response', 500);
  }

  const rows = table.split(/<\/?tr>/g);
  const fields: Record<string, string> = {};
  for (const row of rows) {
    const [, k, , v] = row.split(/<\/?td>/g);
    fields[(k ?? '').replace(/:/g, '').trim()] = v;
  }

  const level = parseInt(fields['HPR Cert. Level']);
  // HACK
  const expires = Date.parse(fields['Exp Date'] + ' PST');
  const [, firstName, lastName] =
    fields['Name'].replace(/&nbsp;/g, ' ').match(/(\S+)\s+(.*)/) ?? [];

  return {
    memberId,
    firstName,
    lastName,
    level: isNaN(level) ? 0 : level,
    expires,
    organization: CertOrg.NAR,
  };
}

async function fetchTRA(memberId: number, env: Env) {
  const bucketId = memberId ? String(Math.floor(memberId / BUCKET_SIZE)) : null;

  const certBucket = bucketId
    ? await env.ClubMembers.get<CertGroup>(bucketId, {
        type: 'json',
      })
    : null;

  const cert = certBucket?.[memberId ?? ''];

  return cert;
}

async function handleRequest(request: Request, env: Env) {
  const { searchParams } = new URL(request.url);
  const memberId = parseInt(searchParams.get('id') ?? '');
  const org = searchParams.get('org') ?? CertOrg.TRA;

  if (isNaN(memberId)) {
    throw new HTTPError('Invalid ID', 400);
  }

  let cert;
  switch (org) {
    case CertOrg.TRA: {
      cert = await fetchTRA(memberId, env);
      break;
    }
    case CertOrg.NAR: {
      cert = await fetchNAR(memberId, env);
      break;
    }
  }

  if (!cert) {
    throw new HTTPError('Member not found', 404);
  }

  return cert;
}
