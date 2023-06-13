import { CertOrg, Env, iCert } from './cert_types';
import { certsBulkUpdate } from './db-util';
import { TRIPOLI_CERT_MAP } from './index';
import KVStore from './KVStore';

// See "Member Certification List(csv)" at
// https://www.tripoli.org/content.aspx?page_id=22&club_id=795696&module_id=468541
const TRA_MEMBERS_LIST = 'https://tripoli.org/docs.ashx?id=916333';

const FETCH_INFO_KEY = 'TRA.fetchInfo';

// Interval to wait before fetching again
const IDLE_INTERVAL = 6 * 60 * 60 * 1000;

type FetchInfo = {
  updatedAt: Date;
  certsFetched: number;
  lastModified: string;
};

// fetch the members list from the source and parse it
async function fetchTripoliCerts() {
  const certs: iCert[] = [];
  const resp = await fetch(TRA_MEMBERS_LIST);

  // Response is ASCII text but server sets the content-type to
  // `application/octet-stream` which causes wrangler to complain if we try to
  // read the response as `text()`.  So we jump through a few hoops here to
  // "officially" convert raw bytes to an actual string.
  const csvRaw = await resp.arrayBuffer();
  const td = new TextDecoder('ascii');
  const csv = td.decode(csvRaw);

  // Map lines => member structs;
  const lines = csv.split('\n');
  for (const line of lines) {
    // Parse CSV line, removing trailing quotes
    // TODO: This will break if there are commas in the field values
    const fields = line
      .match(/"(?:[^"]|"")*"/g)
      ?.map(v => v.replaceAll(/^"|"$/g, '').replace(/""/g, '"'));

    if (!fields) continue;

    // Skip header rows (any row with a non-parsable id field
    const memberId = /^\d+$/.test(fields[0]) && parseInt(fields[0]);
    const [lastName = '', firstName = ''] = fields[1].split(/,\s*/g);
    const level = parseInt(TRIPOLI_CERT_MAP[fields[2]] ?? fields[2]);
    const expires = Date.parse(fields[3] + ' PST');

    if (memberId === false || isNaN(memberId)) continue;

    certs.push({
      memberId,
      firstName,
      lastName,
      level: isNaN(level) ? 0 : level,
      expires: isNaN(expires) ? 0 : expires,
      organization: CertOrg.TRA,
    });
  }

  // Filter out invalid or expired certs.  (Allow for a 24-hour grace period)
  const now = Date.now() - 1000 * 60 * 60 * 24;
  return certs.filter(cert => {
    return !!cert?.memberId && cert.expires > now;
  });
}

export async function updateTRACerts(env: Env) {
  const kv = new KVStore(env);
  let fetchInfo = await kv.get<FetchInfo>(FETCH_INFO_KEY);

  // Add a 1-hour fudge factor to account for clock skew between systems
  const since = Date.now() - Number(fetchInfo?.updatedAt ?? 0) + 3600e3;
  if (since < IDLE_INTERVAL) {
    console.warn(
      `TRA: Idling for ${Math.floor((IDLE_INTERVAL - since) / 60000)} minutes`
    );
    return;
  }

  // Fetch members list (CSV file)
  const resp = await fetch(TRA_MEMBERS_LIST);

  //  Stop here if it hasn't been modified since we last checked
  const lastModified = resp.headers.get('last-modified') ?? '';

  if (!lastModified || lastModified !== fetchInfo?.lastModified) {
  } else {
    console.warn('TRA: Skipping (not modified)');
  }

  const certs = await fetchTripoliCerts();

  await Promise.all([
    certsBulkUpdate(env, certs),
    kv.put(FETCH_INFO_KEY, {
      updatedAt: new Date(),
      certsFetched: certs.length,
      lastModified,
    }),
  ]);
}
