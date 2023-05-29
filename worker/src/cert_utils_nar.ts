import { CertOrg, Env, iCert, NARCacheInfo } from './cert_types';

const CACHE_INFO_KEY = `${CertOrg.NAR}:cache_info`;

export function isCert(cert?: iCert): cert is iCert {
  return !!cert?.memberId;
}

export async function updateNARCerts(env: Env) {
  const cacheInfo = await env.HPRCerts.get<NARCacheInfo>(CACHE_INFO_KEY, {
    type: 'json',
  });
  if (!cacheInfo) {
    throw new Error('No cache info found');
  }

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
