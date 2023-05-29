import { CertOrg, Env, iCert } from './cert_types';
import { certsBulkUpdate } from './db_utils.js';
import { TRIPOLI_CERT_MAP } from './index';

const TRA_MEMBERS_LIST = 'https://tripoli.org/docs.ashx?id=916333';

// fetch the members list from the source and parse it
async function fetchTripoliCerts() {
  const certs: iCert[] = [];
  const resp = await fetch(TRA_MEMBERS_LIST);

  // Response is ASCII text, but tripoli sets the content-type to
  // `application/octet-stream` which causes wrangler to complain if we try to
  // read the response as `text()`.  So we jump through a few hoops here to
  // "officially" convert the bytes to an actual string.
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
  const certs = await fetchTripoliCerts();

  console.log(`Updating ${certs.length} active certs`);

  await certsBulkUpdate(env, certs);
  console.log(`Success!`);
}
