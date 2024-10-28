import { Env } from './cert_types';

function dateReviver(key: string, value: unknown) {
  if (typeof value === 'string') {
    const a = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
    if (a) {
      return new Date(value);
    }
  }
  return value;
}

// Wrapper for CF KV store that can be used in both worker and CLI contexts
export default class KVStore {
  constructor(public readonly env: Partial<Env>) {}

  private _fetch(path: string, options: RequestInit = {}) {
    const {
      CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_KV_NAMESPACE,
    } = this.env;

    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_KV_NAMESPACE}/${path}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
    };

    return fetch(url, { ...options, headers });
  }

  async get<T>(key: string) {
    let json: string | null = null;

    // Worker context
    if (this.env.CertsKV) {
      json = await this.env.CertsKV.get(key);
    } else {
      const kvRes = await this._fetch(`values/${key}`);

      if (!kvRes.ok) {
        if (kvRes.status === 404) {
          return null;
        }

        throw new Error(`get status = ${kvRes.status}`);
      }

      json = await kvRes.text();
    }

    return json ? (JSON.parse(json, dateReviver) as T) : null;
  }

  async put(key: string, value: unknown) {
    // Worker context
    if (this.env.CertsKV) {
      await this.env.CertsKV.put(key, JSON.stringify(value, null, 2));
      return;
    }

    const kvRes = await this._fetch(`values/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });

    if (!kvRes.ok) {
      throw new Error(`put status = ${kvRes.status}`);
    }
  }

  async bulkPut<T>(env: Partial<Env>, entries: [string, T][]) {
    const kvs = entries.map(([key, value]) => {
      return {
        key,
        value: JSON.stringify(value),
      };
    });

    const body = JSON.stringify(kvs);

    const kvRes = await this._fetch('bulk', { method: 'PUT', body });

    if (!kvRes.ok) {
      throw new Error(`bulkPut status = ${kvRes.status}`);
    }
  }
}
