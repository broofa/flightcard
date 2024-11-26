import type { TRACache } from '@flightcard/common';
import { CertOrg, type iCert } from '../../types_certs';
import { CFAPI } from './CFAPI';
import ConsoleWithPrefix from './ConsoleWithPrefix';
import { certsBulkUpdate } from './db-util';

// Create a logger for this module
const console = new ConsoleWithPrefix('TRA');

export const TRA_CACHE_KEY = 'TRA.fetchInfo';

// Tripoli uses some special codes for their cert levels, which we need to map
// to the expected 0-3 values.
const TRIPOLI_CERT_MAP: Record<string, string> = {
  // "Exam required" - Member's dues are paid, but they need to retake L2 exam
  // to reinstate their L2/L3 cert
  '3ER': '1',
  '2ER': '1',

  // Mentor L1
  M1: '1',

  // Same thing as M1???
  M: '1',
};

// fetch the members list from the source and parse it
async function traProcess(membersCSV: string) {
  const certs: iCert[] = [];
  let publishedAt: string | undefined;

  // Map lines => member structs;
  const lines = membersCSV.split('\n');
  for (const line of lines) {
    // Parse CSV line.  Some tra members have quoted nick names in the name
    // field so we need to be a little careful about how we do this.  Also, Some
    // member names have more than one comma in them.  E.g. "Snyder Jr, PhD, Rev
    // Gary".  So we just take everything before the first comma as the last
    // name, and everything else as the first name

    const fields = line.split('","');

    // Remove quotes not removed by split()
    fields[0] = fields[0].replace(/^"/, '');
    fields[fields.length - 1] = fields[fields.length - 1].replace(/"$/, '');

    // Skip lines with less than 2 fields (not expected)
    if (fields.length < 2) continue;

    // Detect line containing when data was updated, like
    // "9/19/2024 10:20 PM","","","",""
    if (/^\d+\/\d+\/\d+/.test(fields[0])) {
      publishedAt = fields[0];
      continue;
    }

    const memberId = /^\d+$/.test(fields[0])
      ? Number.parseInt(fields[0])
      : undefined;
    const lastName = fields[1].replace(/,.*/, '');
    const firstName = fields[1].replace(/.*,\s*/, '');
    const level = Number.parseInt(TRIPOLI_CERT_MAP[fields[2]] ?? fields[2]);
    const expires = Date.parse(fields[3]);

    // Skip entries with invalid member ids
    if (!memberId || Number.isNaN(memberId)) continue;

    certs.push({
      memberId,
      firstName,
      lastName,
      level: Number.isNaN(level) ? 0 : level,
      expires: Number.isNaN(expires) ? 0 : expires,
      organization: CertOrg.TRA,
    });
  }

  console.log('Found', certs.length, 'certs out of ', lines.length, 'lines');

  return { certs, publishedAt };
}

export async function traUpdate(membersCSV: string, env: Env) {
  const cf = new CFAPI(env);

  const { certs, publishedAt } = await traProcess(membersCSV);

  const fetchInfo: TRACache = {
    scannedAt: new Date().toISOString(),
    certsFetched: certs.length,
    publishedAt,
  };

  await Promise.all([
    certsBulkUpdate(env, certs),
    cf.kvPut(TRA_CACHE_KEY, fetchInfo),
  ]);
}
