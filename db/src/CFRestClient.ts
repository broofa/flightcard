import { API_BASE } from './CFDatabaseClient';

export class CFRestClient {
  /**
   *
   * @param accountID The Cloudflare account ID
   * @param apiToken  The Cloudflare API token
   */
  constructor(
    private accountID: string,
    private apiToken: string
  ) {}

  endpoint(...parts: string[]) {
    return [API_BASE, 'accounts', this.accountID, ...parts].join('/');
  }

  endpointPath(url: string) {
    return url.replace(this.endpoint(), '');
  }

  async fetch(url: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiToken}`,
      ...options?.headers,
    };

    const requestOptions = { ...options, headers };

    return await fetch(url, requestOptions);
  }
}
