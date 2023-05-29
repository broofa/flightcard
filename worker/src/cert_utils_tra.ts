import { CertOrg, Env, iCert, TRACacheInfo } from './cert_types';
import { TRIPOLI_CERT_MAP } from './index';

const TRA_MEMBERS_LIST = 'https://tripoli.org/docs.ashx?id=916333';
const MAX_CERTS_UPDATE = 200;
const CACHE_INFO_KEY = `${CertOrg.TRA}:cache_info`;

export function isCert(cert?: iCert): cert is iCert {
  return !!cert?.memberId;
}

// Hash string that should (in theory) change whenever something important in
// the cert changes.  We need this because Tripoli doesn't provide an
// `updatedAt` field to indicate when a cert value has changed
export function updateHash(cert: iCert) {
  return `L${cert.level}@${Math.floor(cert.expires / (24 * 3600e3))}`;
}

// fetch the members list from the source and parse it
export async function fetchTripoliCerts(
  updateHashById: Record<string, string> = {}
) {
  const resp = await fetch(TRA_MEMBERS_LIST);
  const csv = await resp.text();

  // Map lines => member structs;
  const lines = csv.split('\n');
  const certs = lines
    .map((line): iCert | undefined => {
      // Parse CSV line, removing trailing quotes
      // TODO: This will break if there are commas in the field values
      const fields = line
        .match(/"(?:[^"]|"")*"/g)
        ?.map(v => v.replaceAll(/^"|"$/g, '').replace(/""/g, '"'));

      if (!fields) return;

      // Skip header rows (any row with a non-parsable id field
      const memberId = /^\d+$/.test(fields[0]) && parseInt(fields[0]);
      const [lastName = '', firstName = ''] = fields[1].split(/,\s*/g);
      const level = parseInt(TRIPOLI_CERT_MAP[fields[2]] ?? fields[2]);
      const expires = Date.parse(fields[3] + ' PST');

      if (memberId && isNaN(memberId)) return;

      return {
        memberId,
        firstName,
        lastName,
        level: isNaN(level) ? 0 : level,
        expires: isNaN(expires) ? 0 : expires,
        organization: CertOrg.TRA,
      } as iCert;
    })
    .filter(isCert);

  // Remove certs that haven't changed
  const changedCerts = certs.filter(isCert).filter(cert => {
    return updateHashById[String(cert.memberId)] !== updateHash(cert);
  });

  return { changedCerts, total: certs.length };
}

export async function updateTRACerts(env: Env) {
  let cacheInfo = await env.HPRCerts.get<TRACacheInfo>(CACHE_INFO_KEY, {
    type: 'json',
  });

  if (!cacheInfo) {
    cacheInfo = {
      updatedAt: 0,
      updateHashById: {},
    };
  }

  const { updateHashById } = cacheInfo;
  const { changedCerts } = await fetchTripoliCerts(updateHashById);
  const certsToUpdate = changedCerts.slice(0, MAX_CERTS_UPDATE);

  console.log(
    `Updating ${certsToUpdate.length} of ${changedCerts.length} changed certs`
  );

  await Promise.allSettled(
    certsToUpdate.map(async cert => {
      try {
        await env.HPRCerts.put(
          `${CertOrg.TRA}:${cert.memberId}`,
          JSON.stringify(cert)
        );
        console.log(`TRA:${cert.memberId} updated`);
      } catch (err) {
        console.log(`TRA:${cert.memberId} Error: ${(err as Error).message}`);
      }
      // Update cache info
      updateHashById[cert.memberId] = updateHash(cert);
    })
  );

  cacheInfo.updatedAt = Date.now();
  console.log(`Updating ${CACHE_INFO_KEY}`);
  await env.HPRCerts.put(CACHE_INFO_KEY, JSON.stringify(cacheInfo), {
    metadata: { updatedAt: new Date().toISOString() },
  });
  console.log(`Update complete`);
}
