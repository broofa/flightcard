import { CertOrg, iCert } from '../../types_certs';
import { CFAPI } from '../lib/CFAPI';
import ConsoleWithPrefix from '../lib/ConsoleWithPrefix';
import { certsBulkUpdate } from '../lib/db-util';
import { NARItem, NARPage } from './nar_types';
import NARAPI from './NARAPI';
import { Scan, scanInit, scanIsComplete, scanReset } from './scan';

// Create a logger for this module
const console = new ConsoleWithPrefix('NAR');

const SCAN_STATE_KEY = 'NAR.scanState';

// Interval to wait after completing a scan before starting a new one.
const IDLE_INTERVAL = 6 * 60 * 60 * 1000;

export function neonToTimestamp(ts: string) {
  const [date, time] = ts.split(' ');
  return Date.parse(`${date}T${time}Z`);
}

export function timestampToNeon(ts: number, dateOnly = false) {
  const date = new Date(ts).toISOString();
  return dateOnly
    ? date.replace(/T.*/, '')
    : // ISO8601? Time zones?  Neon ain't got time for that shit.
      date.replace('T', ' ').replace('Z', '');
}

export async function updateNARCerts(env: Env) {
  const { NAR_API_ORG = '', NAR_API_KEY = '' } = env;
  const nar = new NARAPI(NAR_API_ORG, NAR_API_KEY);

  const cf = new CFAPI(env);

  console.log('Starting update');
  // Recover scan state
  let scanState = await cf.kvGet<Scan>(SCAN_STATE_KEY);
  if (!scanState) {
    scanState = scanInit();
  }

  console.log('Scan state:', scanState);
  // If previous scan completed ...
  if (scanIsComplete(scanState)) {
    console.log('Previous scan complete');

    // Impose some idle time before starting a new scan (so we're not constantly
    // hammering the Neon DB)
    const since = Date.now() - Number(scanState.scanUpdateAt ?? 0);
    if (!isNaN(since) && since < IDLE_INTERVAL) {
      console.warn(
        `Idling for ${Math.floor((IDLE_INTERVAL - since) / 60000)} minutes`
      );
      return;
    }

    console.log('Updating fields');
    // Update query fields with the results of the previous scan
    scanReset(scanState);
  }

  console.log('Fetching members');
  const page = await nar.fetchMembers(scanState);

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

async function processCerts(env: Env, page: NARPage<NARItem>) {
  const certs: iCert[] = [];
  for (const result of page.searchResults) {
    // The NAR database has entries for anyone who's created an
    // account on the NAR website, not all of whom are NAR members.  So we need
    // to filter out non-members (members that don't have required fields).
    // E.g...
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
