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

const MEMBERS_URL = 'https://tripoli.org/docs.ashx?id=916333';
const BUCKET_SIZE = 1000;
const DOMAIN_WHITELIST = /\.flightcard\.org$|^localhost$/;

export interface Env {
  TripoliMembers: KVNamespace;
}

class HTTPError extends Error {
  constructor(public message: string, public statusCode = 500) {
    super(message);
  }
}

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  level: number;
  expires: number;
};

type MemberMap = Record<string, Member>;

function isMember(member?: Member): member is Member {
  return !!member?.id;
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
          stack: statusCode ? undefined : stack,
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
    ctx.waitUntil(updateMembersKV(env));
  },
};

// fetch the members list from the source and parse it
async function fetchMembers() {
  const resp = await fetch(MEMBERS_URL);
  const csv = await resp.text();

  // Map lines => member structs
  const lines = csv.split('\n');
  const members = lines.map((line): Member | undefined => {
    // Parse CSV line, removing trailing quotes
    // TODO: This'll break if there are commas in the field values
    const fields = line.match(/"[^"]+"/g)?.map(v => v.replaceAll('"', ''));

    if (!fields) return;

    // Skip header rows (any row with a non-parsable id field
    if (!/^\d+$/.test(fields[0])) return;

    const [lastName, firstName] = fields[1].split(/,\s*/g);

    return {
      id: parseInt(fields[0]),
      firstName,
      lastName,
      level: parseInt(fields[2]),
      expires: Date.parse(fields[3]),
    };
  });

  return members.filter(isMember);
}

async function updateMembersKV(env: Env) {
  const members = await fetchMembers();
  const groups: Record<string, MemberMap> = {};

  // Record the last update time (attempt)
  console.log('PUT', 'lastUpdate');

  await env.TripoliMembers.put('lastUpdate', JSON.stringify(Date.now()));

  // Group members into buckets
  for (const member of members) {
    const { id } = member;
    const key = Math.floor(id / BUCKET_SIZE);
    if (!groups[key]) groups[key] = {};
    groups[key][id] = member;
  }

  // Save each bucket into KV
  //
  //  NOTE: CF limits free plan to 1,000 writes per day, which is why we do this in buckets
  const results = await Promise.allSettled(
    Object.entries(groups).map(([k, v]) => {
      console.log('PUT', k);
      return env.TripoliMembers.put(String(k), JSON.stringify(v));
    })
  );
  console.log('RESULTS', results);
}

async function handleRequest(request: Request, env: Env) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const bucketId = id ? String(Math.floor(parseInt(id) / BUCKET_SIZE)) : null;

  const memberBucket = bucketId
    ? await env.TripoliMembers.get<MemberMap>(bucketId, {
        type: 'json',
      })
    : null;

  const member = memberBucket?.[id ?? ''];

  if (!member) {
    throw new HTTPError('Member not found', 404);
  }

  return member;
}
