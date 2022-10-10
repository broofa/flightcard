import { CertOrg, Env, iCert, TRACacheInfo } from './cert_types';
import { TRIPOLI_CERT_MAP } from './index';

const TRA_MEMBERS_LIST = 'https://tripoli.org/docs.ashx?id=916333';
const CACHE_INFO_KEY = `${CertOrg.TRA}:cache_info`;

export function isCert(cert?: iCert): cert is iCert {
  return !!cert?.memberId;
}

// Hash string that should (in theory) change whenever something important in
// the cert changes.  We need this because Tripoli doesn't provide an
// `updatedAt` field to indicate when a cert value has changed
export function updateHash(cert: iCert) {
  const { level, expires } = cert;
  return `${Math.floor(expires / (24 * 3600e3))}L${level}`;
}

// fetch the members list from the source and parse it
export async function fetchTripoliCerts(
  updateHashById: Record<string, string> = {}
) {
  const resp = await fetch(TRA_MEMBERS_LIST);
  const csv = await resp.text();

  // Map lines => member structs;
  const lines = csv.split('\n');
  let certs = lines
    .map((line): iCert | undefined => {
      // Parse CSV line, removing trailing quotes
      // TODO: This'll break if there are commas in the field values
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

  const total = certs.length;

  // Remove certs that haven't changed
  certs = certs.filter(isCert).filter(cert => {
    return updateHashById[String(cert.memberId)] !== updateHash(cert);
  });

  return { certs, total };
}

export async function updateTripoliCerts(env: Env) {
  const cacheInfo = await env.HPRCerts.get<TRACacheInfo>(CACHE_INFO_KEY, {
    type: 'json',
  });
  if (!cacheInfo) {
    throw new Error('No cache info found');
  }

  const { updateHashById } = cacheInfo;
  const { certs, total } = await fetchTripoliCerts(updateHashById);

  if (certs.length > 200) {
    throw new Error(`${certs.length} changed certs (too many to update here)`);
  }

  console.log(`Updating ${certs.length} of ${total} certs`);

  await Promise.allSettled(
    certs.map(async cert => {
      await env.HPRCerts.put(
        `${CertOrg.TRA}:${cert.memberId}`,
        JSON.stringify(cert)
      );

      // Update  cache info
      updateHashById[cert.memberId] = updateHash(cert);
    })
  );

  cacheInfo.updatedAt = Date.now();

  env.HPRCerts.put(CACHE_INFO_KEY, JSON.stringify(cacheInfo), {
    metadata: { updatedAt: Date.now() },
  });
}
