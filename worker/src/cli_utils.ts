import { CertOrg, iCert } from './cert_types';

declare const process: {
  env: {
    CLOUDFLARE_API_TOKEN: string;
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_KV_NAMESPACE: string;
  };
};

const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE } =
  process.env;

const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_KV_NAMESPACE}`;

const CF_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
};

// Put certificates into KV
export async function putCerts(org: CertOrg, certs: iCert[]) {
  // CF limits bulk writes to 10,000 keys / request
  const BATCH_SIZE = 10_000;

  // Dedupe
  const ids = new Set();
  certs = certs.filter(cert => {
    if (ids.has(cert.memberId)) {
      return false;
    }
    ids.add(cert.memberId);
    return true;
  });

  const url = `${CF_BASE}/bulk`;

  for (let i = 0; i < certs.length; i += BATCH_SIZE) {
    const batch = certs.slice(i, i + BATCH_SIZE);

    console.log(`Saving ${i}-${i + batch.length} of ${certs.length}`);

    const updatedAt = Date.now();

    const body = JSON.stringify(
      batch.map(cert => {
        return {
          key: `${org}:${cert.memberId}`,
          value: JSON.stringify(cert),
          metadata: { updatedAt },
        };
      })
    );

    const kvRes = await fetch(url, {
      method: 'PUT',
      body,
      headers: CF_HEADERS,
    });

    if (!kvRes.ok) {
      throw new Error(`putCerts status = ${kvRes.status}`);
    }
  }
}

// Get state we use for db caching
export async function getCacheInfo<T = Record<string, unknown>>(org: CertOrg) {
  const url = `${CF_BASE}/values/${org}:cache_info`;

  const kvRes = await fetch(url, { headers: CF_HEADERS });

  if (!kvRes.ok) {
    if (kvRes.status === 404) {
      return {} as T;
    }
    throw new Error(`getCacheInfo status = ${kvRes.status}`);
  }

  const cacheInfo: T = await kvRes.json();
  if (!cacheInfo) return {} as T;
  return cacheInfo;
}

// Put state we use for db caching
export async function putCacheInfo<T = Record<string, unknown>>(
  org: CertOrg,
  info: T
) {
  const url = `${CF_BASE}/values/${org}:cache_info`;
  const body = JSON.stringify(info);

  const kvRes = await fetch(url, { method: 'PUT', body, headers: CF_HEADERS });

  if (!kvRes.ok) {
    throw new Error(`putCacheInfo status = ${kvRes.status}`);
  }
}
