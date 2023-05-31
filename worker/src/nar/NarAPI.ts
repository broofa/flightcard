import { NARItem, NARPage, NeonPagination } from './nar_types.js';

/**
 * API for I/O with NAR database on Neon CRM.
 *
 * Use `listOutputFields()` or `listSearchFields()`, below, to dump a list of the fields you can use.
 *
 * # Misc. Notes when constructing queries...
 *
 * The `outputFields` array is a list of field names (for `standardFields`), or field IDs (for `customFields`).
 *
 * `searchField` operators may be one of:
 *   - BLANK
 *   - NOT_BLANK
 *   - EQUAL
 *   - NOT_EQUAL
 *   - IN_RANGE
 *   - NOT_IN_RANGE
 *   - CONTAIN
 *   - GREATER_THAN
 *   - LESS_THAN
 *   - GREATER_AND_EQUAL
 *   - LESS_AND_EQUAL
 *
 * `pagination.sortColumn` must be one of the `outputFields`
 *
 * `pagination.sortDirection` must be one of `ASC` or `DESC`
 *
 * REF: https://developer.neoncrm.com/api-v2/#/
 */
const API_BASE = `https://api.neoncrm.com/v2`;

// NeonCRM limits the page size to 200
const MAX_PAGE_SIZE = 200;

type CustomField = {
  id: number;
  displayName: string;
};

type StandardSearchField = {
  fieldName: string;
};

type OutputFields = {
  standardFields: string[];
  customFields: CustomField[];
};

type SearchFields = {
  standardFields: StandardSearchField[];
  customFields: CustomField[];
};

// Ad-hoc type for tracking the state we use to scanning the NAR database.
export type ScanState = {
  queryAccountId: number;
  queryTimestamp: number;
  pagination?: NeonPagination;
  trackingAccountId: number;
  trackingTimestamp: number;
};

function neonToTimestamp(ts: string) {
  const [date, time] = ts.split(' ');
  return Date.parse(`${date}T${time}Z`);
}

function timestampToNeon(ts: number, dateOnly = false) {
  const [date, time] = new Date(ts).toISOString().split('T');

  return dateOnly ? date : `${date} ${time.substring(0, -1)}`;
}

export function createScanState() {
  return {
    queryAccountId: 0,
    queryTimestamp: 0,
    trackingAccountId: 0,
    trackingTimestamp: 0,
  };
}

export function scanComplete(pagination?: NeonPagination) {
  return pagination && pagination.currentPage >= pagination.totalPages - 1;
}

export function updateScanState(scanState: ScanState, page: NARPage<NARItem>) {
  const { pagination } = page;

  scanState.pagination = pagination;

  // If this is the last page of a scan, update the query fields and reset the
  // tracking fields
  if (scanComplete(pagination)) {
    scanState.queryAccountId = scanState.trackingAccountId;
    scanState.queryTimestamp = scanState.trackingTimestamp;
    scanState.trackingAccountId = 0;
    scanState.trackingTimestamp = 0;
    delete scanState.pagination;

    return;
  }

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

export default class NarAPI {
  constructor(private org: string, private key: string) {}

  async #fetch<T>(path: string, options?: RequestInit) {
    const headers = {
      Authorization: `Basic ${btoa(`${this.org}:${this.key}`)}`,
      'Content-Type': 'application/json',
    };
    const url = `${API_BASE}${path}`;

    const start = Date.now();
    const response = await fetch(url, { ...options, headers });
    const time = Date.now() - start;
    console.log(`${response.status}, ${path}, ${time / 1000} seconds`);

    if (!response.ok) {
      console.error('StatusText', await response.statusText);
      console.error('Body', await response.text());
      throw new Error(`REQUEST FAILED ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async listOutputFields() {
    const { standardFields, customFields } = await this.#fetch<OutputFields>(
      '/accounts/search/outputFields'
    );
    for (const f of standardFields.sort()) {
      console.log(f);
    }
    for (const f of customFields.sort((a, b) => a.id - b.id)) {
      console.log(f.id, f.displayName);
    }
  }

  async listSearchFields() {
    const { standardFields, customFields } = await this.#fetch<SearchFields>(
      '/accounts/search/searchFields'
    );

    // searchFields = searchFields.map(f => f.fieldName);
    standardFields.sort((a, b) => a.fieldName.localeCompare(b.fieldName));
    customFields.sort((a, b) => a.id - b.id);

    for (const f of standardFields) {
      console.log(f.fieldName);
    }
    for (const f of customFields) {
      console.log(f.id, f.displayName);
    }
  }

  async listCustomFields(category: string) {
    const fields = await this.#fetch<{ id: number; name: string }[]>(
      `/customFields?category=${category}`
    );

    for (const field of fields) {
      console.log(field.id, field.name);
    }
  }

  async accountQuery<T = NARItem>(options: RequestInit) {
    return await this.#fetch<NARPage<T>>(`/accounts/search`, {
      method: 'POST',
      ...options,
    });
  }

  /**
   * Fetch a page of members from the NAR database.
   *
   * So... imagine one of those shitty paper straws that collapses when you try
   * to suck a milkshake through it.  No leave it out in the rain overnight and
   * then stick it into the NeonCRM database that NAR keeps their membership
   * info in.
   *
   * That's what it's like to work with this database.  Queries take a minimum
   * of 5 seconds, and regularly take 10-15 seconds.  Better still, we're capped
   * at 200 results per query, meaning it takes 350+ queries to fetch the whole
   * DB.  Thus, our interaction with the DB is a two stage process:
   *  1. Full scan:  Fetch all users, one page at a time, and store them in our
   *     DB.  For this, we use a query that orders by accountId and we keep
   *     track of the last accountId we've seen.  This allows us to resume the
   *     scan if / when our scan gets interrupted.
   *
   * 2. Incremental updates:  Similar to the first scan, but limited to records
   *    that have been modified since the 'last modified date' recorded in stage
   */
  async fetchMembers(scanState?: ScanState) {
    if (!scanState) {
      scanState = {
        queryAccountId: 0,
        queryTimestamp: 0,
        trackingAccountId: 0,
        trackingTimestamp: 0,
      };
    }

    const pagination = {
      currentPage: scanState.pagination ? scanState.pagination.currentPage + 1 : 0,
      pageSize: MAX_PAGE_SIZE,

      // Sort by account ID, so we can resume the scan if it gets interrupted
      //
      // Note: `sortColumn` must be one of the `outputFields`
      sortColumn: 'Account ID',
      sortDirection: 'ASC',
    };

    const outputFields = [
      'Account ID',
      'Membership Expiration Date',
      'Account Last Modified Date/Time',
      'First Name',
      'Last Name',
      43, // HPR
      44, // NAR#
    ];

    const searchFields = [
      {
        field: 'Account ID',
        operator: 'GREATER_AND_EQUAL',
        value: scanState.queryAccountId,
      },
      {
        field: 'Account Last Modified Date',
        operator: 'GREATER_AND_EQUAL',
        value: timestampToNeon(scanState.queryTimestamp, true),
      },
    ];

    const options = {
      body: JSON.stringify({ searchFields, outputFields, pagination }),
    };

    return await this.accountQuery(options);
  }
}
