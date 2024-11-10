import type { NeonPagination } from './nar_types';

export type Scan = {
  // Timestamp most recent query in the current scan
  scanUpdateAt?: string;

  // Timestamp of most recent scan start
  scanBeginAt?: string;

  // Timestamp of most recent scan end (if a scan is active - which is usually
  // the case - this will be the time the *previous* scan ended)
  scanEndAt?: string;

  // pagination of most recently fetched page
  pagination?: NeonPagination;

  // Query fields for fetching a page in the current scan
  queryAccountId: number;
  queryTimestamp: number;

  // The max account ID and timestamp of the current scan.  This is updated as
  // the scan progresses.  Once the scan is complete, these are set as the
  // query* fields to optimize subsequent scans.
  trackingAccountId: number;
  trackingTimestamp: number;
};
