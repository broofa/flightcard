import type {
  NARItem,
  NAROutputFields,
  NARPage,
  NARSearchFields,
  Scan,
} from '@flightcard/common-types';
import ConsoleWithPrefix from '../lib/ConsoleWithPrefix';
import { timestampToNeon } from './nar-util';
import { scanIsComplete, scanUpdate } from './scan';

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

const console = new ConsoleWithPrefix('NAR');

const API_BASE = 'https://api.neoncrm.com/v2';

// NeonCRM limits the page size to 200
const MAX_PAGE_SIZE = 200;

export default class NARAPI {
  constructor(
    private org: string,
    private key: string
  ) {}

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
    const { standardFields, customFields } = await this.#fetch<NAROutputFields>(
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
    const { standardFields, customFields } = await this.#fetch<NARSearchFields>(
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

  /**
   * Fetch a page of members from the NAR database.
   *
   * This code is... well... you know those shitty paper straws that collapse
   * when you try to suck a milkshake through them?  The NeonCRM database that
   * NAR keeps their membership info in is kind of like that. Queries to the db
   * take ~15-20 seconds. Better still, they're capped at 200 results per query.
   * This for a DB that has ~75,000 records.
   *
   * So a full scan of the DB takes at least an hour... and that's if we're
   * willing to saturate the DB during that time, which I'm loath to do
   *
   * Thus, our interaction with the DB is a two stage process:
   *
   *  1. Full scan:  Fetch all users, one page at a time, and store them in our
   *     DB.  For this, we use a query that orders by accountId and we keep
   *     track of the last accountId we've seen.  This allows us to resume the
   *     scan if / when our scan gets interrupted.
   *
   * 2. Incremental updates:  Similar to the first scan, but limited to records
   *    that have been modified since the 'last modified date' recorded in stage
   *
   * Scan state has to be persisted between calls, which is currently done using
   * Cloudflare KV.
   */
  async fetchMembers(scan: Scan) {
    const {
      pagination: previousPagination,
      queryAccountId,
      queryTimestamp,
    } = scan;

    let currentPage = 0;
    if (previousPagination && !scanIsComplete(scan)) {
      currentPage = previousPagination.currentPage + 1;
    } else {
      scan.scanBeginAt = new Date().toISOString();
    }

    const pagination = {
      currentPage,
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
        value: queryAccountId,
      },
      {
        field: 'Account Last Modified Date',
        operator: 'GREATER_AND_EQUAL',
        value: timestampToNeon(queryTimestamp, true),
      },
    ];

    console.log(`Fetching page ${currentPage}...`);

    const page = await this.#fetch<NARPage<NARItem>>('/accounts/search', {
      method: 'POST',
      body: JSON.stringify({ searchFields, outputFields, pagination }),
    });

    scanUpdate(scan, page);

    if (scanIsComplete(scan)) {
      console.log('Scan complete');
      scan.scanEndAt = new Date().toISOString();
    }

    return page;
  }
}
