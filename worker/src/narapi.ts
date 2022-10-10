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

declare const process: {
  env: {
    NAR_API_KEY: string;
    NAR_API_ORG: string;
  };
};

const { NAR_API_KEY, NAR_API_ORG } = process.env;

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

export default class NarAPI {
  constructor(private org: string, private key: string) {}

  async #fetch<T>(path: string, options?: RequestInit) {
    const headers = {
      Authorization: `Basic ${btoa(`${NAR_API_ORG}:${NAR_API_KEY}`)}`,
      'Content-Type': 'application/json',
    };
    const url = `${API_BASE}${path}`;

    const start = Date.now();
    const response = await fetch(url, { ...options, headers });
    const time = Date.now() - start;

    console.log(response.status, path, time / 1000);
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

  async accountQuery(options: RequestInit) {
    return await this.#fetch(`/accounts/search`, {
      method: 'POST',
      ...options,
    });
  }
}
