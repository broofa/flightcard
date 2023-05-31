import NarAPI, {
  ScanState,
  createScanState,
  scanComplete,
  updateScanState,
} from './nar/NarAPI.js';
import { CertOrg, Env, iCert } from './cert_types';
import { NARItem, NARPage } from './nar/nar_types.js';
import { certsBulkUpdate } from './db_utils.js';

const SCAN_STATE_KEY = 'NAR.scanState';

export async function updateNARCerts(env: Env) {
  const { NAR_API_ORG = '', NAR_API_KEY = '' } = env;
  const narAPI = new NarAPI(NAR_API_ORG, NAR_API_KEY);

  // Pull previous scan state from KV (if available)
  // let scanState = await kvRead<ScanState>(env, SCAN_STATE_KEY);
  const scanStateJSON = await env.CertsKV.get(SCAN_STATE_KEY);

  // Initialize scan state if necessary
  const scanState = scanStateJSON
    ? JSON.parse(scanStateJSON)
    : createScanState();

  // eslint-disable-next-line no-constant-condition
  console.log('scanState(pre)', scanState);
  const page = await narAPI.fetchMembers(scanState);

  // Process page of members
  await processCerts(env, page);

  // Persist scan state
  updateScanState(scanState, page);

  await env.CertsKV.put(SCAN_STATE_KEY, JSON.stringify(scanState));
  console.log('scanState(post)', scanState);
  console.log(
    `${scanState.pagination.currentPage} of ${scanState.pagination.totalPages} pages processed`
  );
}

async function processCerts(env: Env, page: NARPage<NARItem>) {
  const certs: iCert[] = [];
  for (const result of page.searchResults) {
    const {
      'NAR#': memberIdString,
      // "EXPIRATION": expires,
      // 'Account ID': accountId,
      // 'Account Last Modified Date/Time': modifiedAt,
      'First Name': firstName,
      'Membership Expiration Date': expiresString,
      HPR: levelString,
      'Last Name': lastName,
    } = result;

    const memberId = parseInt(memberIdString, 10);
    // const modified = Date.parse(modifiedAt);
    const level = parseInt(levelString, 10);
    const expires = Date.parse(expiresString);

    if (!memberId || memberId > 1e6) continue;

    const cert: iCert = {
      memberId,
      firstName,
      lastName,
      level: isNaN(level) ? 0 : level,
      expires: isNaN(expires) ? 0 : expires,
      organization: CertOrg.NAR,
    };

    console.log('Updating', cert.memberId, cert.firstName, cert.lastName);
    certs.push(cert);
  }

  if (certs.length) {
    await certsBulkUpdate(env, certs);
  }
}
