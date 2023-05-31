import { Env } from './cert_types';

function _fetch(env: Env, path: string, options: RequestInit = {}) {
  console.log('ENV', env);
  const {
    CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_KV_NAMESPACE,
  } = env;

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_KV_NAMESPACE}/${path}`;
  console.log('KV URL', url);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  };

  return fetch(url, { ...options, headers });
}

export async function kvRead<T>(env: Env, key: string) {
  const kvRes = await _fetch(env, `values/${key}`);

  if (!kvRes.ok) {
    if (kvRes.status === 404) {
      return null;
    }

    throw new Error(`readKV status = ${kvRes.status}`);
  }

  return await kvRes.json<T>();
}

export async function kvWrite(env: Env, key: string, value: string) {
  const body = JSON.stringify({ value });

  const kvRes = await fetch(`values/${key}`, { method: 'PUT', body });

  if (!kvRes.ok) {
    throw new Error(`writeKV status = ${kvRes.status}`);
  }
}

export async function kvBulkWrite<T>(env: Env, entries: [string, T][]) {
  const kvs = entries.map(([key, value]) => {
    return {
      key,
      value: JSON.stringify(value),
    };
  });

  const body = JSON.stringify(kvs);

  const kvRes = await fetch('bulk', { method: 'PUT', body });

  if (!kvRes.ok) {
    throw new Error(`bulkWriteKV status = ${kvRes.status}`);
  }
}
