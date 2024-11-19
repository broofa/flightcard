/**
 * See https://developers.cloudflare.com/api-next/ for Cloudflare api docs
 */

import { CFRestClient } from './CFRestClient';

type QueryResult = {
  result: unknown[];
  success: boolean;
  errors?: { code: number; message: string }[];
};

class CFDBError extends Error {
  constructor(
    message: string,
    public errors: QueryResult['errors']
  ) {
    super(message);
  }
}

export const API_BASE = 'https://api.cloudflare.com/client/v4';
export default class CFDatabaseClient extends CFRestClient {
  constructor(
    accountID: string,
    apiToken: string,
    private dbID: string
  ) {
    super(accountID, apiToken);
    this.dbID = dbID;
  }

  endpoint(...parts: string[]) {
    return super.endpoint('d1', 'database', this.dbID, ...parts);
  }

  async fetchQuery(url: string, options: RequestInit = {}) {
    const res = await super.fetch(url, options);

    const body = (await res.json()) as QueryResult;

    if (!res.ok) {
      throw new CFDBError(
        `${this.endpointPath(url)}: ${res.status} ${res.statusText}`,
        body.errors
      );
    }

    return body;
  }

  /**
   * REF: https://developers.cloudflare.com/api-next/resources/d1/subresources/database/methods/query/
   */
  async query<T = unknown>(sql: string, ...params: unknown[]) {
    const url = this.endpoint('query');
    const body = JSON.stringify({
      sql,
      params: params.length > 0 ? params : undefined,
    });
    return await this.fetchQuery(url, { method: 'POST', body });
  }

  async raw<T = unknown>(sql: string, ...params: unknown[]) {
    const url = this.endpoint('raw');
    const body = JSON.stringify({
      sql,
      params: params.length > 0 ? params : undefined,
    });
    return await this.fetchQuery(url, { method: 'POST', body });
  }
}
