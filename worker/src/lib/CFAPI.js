/**
 * See https://developers.cloudflare.com/api-next/ for Cloudflare api docs
 */

const API_BASE = 'https://api.cloudflare.com/client/v4';

export class CFAPI {
  /**
   * @type {Env}
   */
  env;
  #useSDK;

  /**
   * @param {Env} env
   */
  constructor(env) {
    this.env = env;
    this.#useSDK = env.CertsKV ? true : false;
  }

  /**
   * @param {...string} parts
   * @returns {string}
   */
  baseUrl(...parts) {
    return [
      API_BASE,
      'accounts',
      this.env.CLOUDFLARE_ACCOUNT_ID,
      ...parts,
    ].join('/');
  }

  /**
   * @param {...string} parts
   * @returns {string}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  kvUrl(...parts) {
    // Throwing this error because I haven't figured out how to
    throw new Error('KV not yet supported by CFAPI');

    // const kvId = this.env.FC_KV;

    // return this.baseUrl('storage', 'kv', 'namespaces', kvId, ...parts);
  }

  dbUrl(...parts) {
    const dbId = this.env.FC_DB;

    return this.baseUrl('d1', 'database', dbId, ...parts);
  }

  /**
   * @param {...string} parts
   * @returns {string}
   */
  apiPath(url) {
    return url.replace(this.baseUrl(), '');
  }

  /**
   * Make a fetch request to the Cloudflare API.
   *
   * @param {string} url
   * @param {RequestInit} [options]
   * @returns {Promise<string>}
   */
  async fetch(url, options) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      if (res.status === 404) {
        return undefined;
      }

      throw new Error(`${res.statusText}: ${this.apiPath(url)}`);
    }

    return await res.text();
  }

  /**
   * @template T
   * @param {string} key
   * @returns {Promise<T>}
   */
  async kvGet(key) {
    let json;
    if (this.#useSDK) {
      json = (await this.env.CertsKV.get(key)) ?? undefined;
    } else {
      json = await this.fetch(this.kvUrl('values', key));
    }

    return json ? JSON.parse(json) : null;
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  async kvPut(key, value) {
    const json = JSON.stringify(value, null, 2);

    if (this.#useSDK) {
      await this.env.CertsKV.put(key, json);
    } else {
      await this.fetch(this.kvUrl('values', key), {
        method: 'PUT',
        body: JSON.stringify({ value: json }),
      });
    }
  }

  /**
   * REF: https://developers.cloudflare.com/api-next/resources/d1/subresources/database/methods/query/
   *
   * @param {string} sql
   * @param  {...string} params
   */
  async dbQuery(sql, ...params) {
    const url = this.dbUrl('query');
    const body = JSON.stringify({ sql, params });

    return await this.fetch(url, { method: 'POST', body });
  }
}
