import type { NARItem, NARPage, Scan } from '@flightcard/common';
import { neonToTimestamp } from './nar-util';

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
  scanState.scanUpdateAt = new Date().toISOString();

  // Update tracking fields
  for (const item of page.searchResults) {
    scanState.trackingAccountId = Math.max(
      scanState.trackingAccountId,
      Number.parseInt(item['Account ID'], 10)
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
