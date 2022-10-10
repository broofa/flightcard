import { CertOrg, TRACacheInfo } from './cert_types';
import { fetchTripoliCerts, updateHash } from './cert_utils_tra';
import { getCacheInfo, putCacheInfo, putCerts } from './cli_utils';

// Call from CLI script
export async function main() {
  const cacheInfo = await getCacheInfo<TRACacheInfo>(CertOrg.TRA);
  const { certs, total } = await fetchTripoliCerts(cacheInfo.updateHashById);

  const { updateHashById = {} } = cacheInfo;

  // If no cert updates, don't bother trying to save of updating cache info
  if (!certs.length) {
    console.log(
      `${certs.length} of ${total} certs changed (no updates necessary)`
    );
    return;
  }

  // Save changed certs
  console.log(`Updating ${certs.length} of ${total} certs`);
  await putCerts(CertOrg.TRA, certs);

  // Update expires cache
  for (const cert of certs) {
    updateHashById[cert.memberId] = updateHash(cert);
  }
  await putCacheInfo<TRACacheInfo>(CertOrg.TRA, {
    updatedAt: Date.now(),
    updateHashById: updateHashById,
  });
}

main();
