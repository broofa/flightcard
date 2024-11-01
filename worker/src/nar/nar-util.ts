import { CertOrg, iCert } from '../../types_certs';
import { CFAPI } from '../lib/CFAPI';
import ConsoleLogger from '../lib/ConsoleLogger';
import { certsBulkUpdate } from '../lib/db-util';
import NarAPI, {
  ScanState,
  initScanState,
  isScanComplete,
  updateScanFields,
} from './NarAPI';
import { NARItem, NARPage } from './nar_types';

// Create a logger for this module
const console = new ConsoleLogger('NAR');

const SCAN_STATE_KEY = 'NAR.scanState';

// Interval to wait after completing a scan before starting a new one.
const IDLE_INTERVAL = 6 * 60 * 60 * 1000;

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
  const narAPI = new NarAPI(NAR_API_ORG, NAR_API_KEY);

  const cf = new CFAPI(env);

  console.log('Starting update');
  // Recover scan state
  let scanState = await cf.kvGet<ScanState>(SCAN_STATE_KEY);
  if (!scanState) {
    scanState = initScanState();
  }

  console.log('Scan state:', scanState);
  // If previous scan completed ...
  if (isScanComplete(scanState)) {
    console.log('Previous scan complete');

    // Impose some idle time before starting a new scan (so we're not constantly
    // hammering the Neon DB)
    const since = Date.now() - Number(scanState.updatedAt ?? 0);
    if (!isNaN(since) && since < IDLE_INTERVAL) {
      console.warn(
        `Idling for ${Math.floor((IDLE_INTERVAL - since) / 60000)} minutes`
      );
      return;
    }

    console.log('Updating fields');
    // Update query fields with the results of the previous scan
    updateScanFields(scanState);
  }

  console.log('Fetching members');
  const page = await narAPI.fetchMembers(scanState);

  // Persist scan state (sideband)
  console.log('Saving scan state:', scanState);
  const kvTask = cf.kvPut(SCAN_STATE_KEY, scanState);

  // Process page
  await processCerts(env, page);

  if (scanState.pagination) {
    console.log(
      `${scanState.pagination.currentPage ?? 0 + 1} / ${
        scanState.pagination.totalPages
      } pages`
    );
  }

  // Make sure kv save completes before returning
  await kvTask;

  console.log('Done');
}
