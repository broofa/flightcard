import { neonToTimestamp } from './nar-util';
import { NARItem, NARPage, NeonPagination } from './nar_types';

// Ad-hoc type for tracking the state used to scan database. E.g.
//
// {
//   "queryAccountId": 0,
//   "queryTimestamp": 0,
//   "trackingAccountId": 21412,
//   "trackingTimestamp": 1730523582000,
//   "pagination": {
//     "currentPage": 0,
//     "pageSize": 200,
//     "sortColumn": "Account ID",
//     "sortDirection": "ASC",
//     "totalPages": 374,
//     "totalResults": 74772
//   },
//   "scannedAt": "2024-11-02T13:46:25.851Z"
// }

export type Scan = {
  scannedAt?: string;

  // pagination of the last page fetched
  pagination?: NeonPagination;

  queryAccountId: number;
  queryTimestamp: number;

  // The max account ID and timestamp seen in the results of scan
  trackingAccountId: number;
  trackingTimestamp: number;
};

export function scanInit(): Scan {
  return {
    queryAccountId: 0,
    queryTimestamp: 0,
    trackingAccountId: 0,
    trackingTimestamp: 0,
  };
}

export function scanIsComplete(scanState: Scan) {
  const { pagination } = scanState;
  if (!pagination) return false;

  return pagination.currentPage >= pagination.totalPages - 1;
}

/**
 * Update scan state with query results
 */
export function scanUpdate(scanState: Scan, page: NARPage<NARItem>) {
  const { pagination } = page;

  scanState.pagination = pagination;
  scanState.scannedAt = new Date().toISOString();

  // Update tracking fields
  for (const item of page.searchResults) {
    scanState.trackingAccountId = Math.max(
      scanState.trackingAccountId,
      parseInt(item['Account ID'], 10)
    );
    scanState.trackingTimestamp = Math.max(
      scanState.trackingTimestamp,
      neonToTimestamp(item['Account Last Modified Date/Time'])
    );
  }
}

/**
 * Update scan state once all pages in a scan have been fetched.  This updates
 * the query fields to only match records that have been modified since the last
 * scan.
 */
export function scanReset(scanState: Scan) {
  if (scanState.trackingAccountId <= 0 || scanState.trackingTimestamp <= 0) {
    return;
  }

  scanState.queryAccountId = scanState.trackingAccountId;
  scanState.queryTimestamp = scanState.trackingTimestamp;
  scanState.trackingAccountId = 0;
  scanState.trackingTimestamp = 0;
}
