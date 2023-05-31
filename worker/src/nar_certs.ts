import NarAPI, {
  ScanState,
  createScanState,
  scanComplete,
  updateScanState,
} from './nar/NarAPI.js';
import { CertOrg, Env, iCert } from './cert_types';
import { NARItem, NARPage } from './nar/nar_types.js';
import { certsBulkUpdate } from './db_utils.js';
import KVStore from './KVStore.js';

const SCAN_STATE_KEY = 'NAR.scanState';

// Interval to wait after completing a scan before starting a new one.
const IDLE_INTERVAL = 1 * 60 * 60 * 1000;

async function processCerts(env: Env, page: NARPage<NARItem>) {
  const certs: iCert[] = [];
  for (const result of page.searchResults) {
    // Skip if missing required fields.  There's a surprising number of these in the DB.  A couple of examples:
    //
    // * Item #204948 missing fields: NAR#
    // * Item #204954 missing fields: NAR#, First Name, Last Name
    const invalids = [];
    for (const field of ['NAR#', 'First Name', 'Last Name']) {
      if (!(result as Record<string, unknown>)[field]) invalids.push(field);
    }
    if (invalids.length > 0) {
      console.warn(
        `Item #${result['Account ID']} missing fields: ${invalids.join(', ')}`
      );
      continue;
    }

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

    if (!memberId || memberId > 1e6) {
      console.warn(
        `Invalid memberId (${memberId}) in result:`,
        JSON.stringify(result, null, 2)
      );
      continue;
    }

    const cert: iCert = {
      memberId,
      firstName,
      lastName,
      level: isNaN(level) ? 0 : level,
      expires: isNaN(expires) ? 0 : expires,
      organization: CertOrg.NAR,
    };

    certs.push(cert);
  }

  if (certs.length) {
    await certsBulkUpdate(env, certs);
  }
}

export async function updateNARCerts(env: Env) {
  const { NAR_API_ORG = '', NAR_API_KEY = '' } = env;

  const kv = new KVStore(env);

  let scanState = await kv.get<ScanState>(SCAN_STATE_KEY);
  if (!scanState) {
    scanState = createScanState();
  }

  // If we've finished a scan recently, wait a while before starting the next
  if (scanComplete(scanState.pagination)) {
    const since = Date.now() - Number(scanState.updatedAt ?? 0);
    if (since < IDLE_INTERVAL) {
      console.warn(
        `NAR: Skipping (${Math.floor(
          (IDLE_INTERVAL - since) / 60000
        )} minutes to next update)`
      );
      return;
    }
  }

  const narAPI = new NarAPI(NAR_API_ORG, NAR_API_KEY);
  // eslint-disable-next-line no-constant-condition
  const page = await narAPI.fetchMembers(scanState);

  // Process page of members
  await processCerts(env, page);

  // Persist scan state
  updateScanState(scanState, page);

  scanState.updatedAt = new Date();
  await kv.put(SCAN_STATE_KEY, scanState);

  if (scanState.pagination) {
    console.log(
      `${scanState.pagination.currentPage ?? 0 + 1} / ${
        scanState.pagination.totalPages
      } pages`
    );
  }
}
