import { CertOrg, Env, iCert } from './cert_types.js';

export async function certsFetch(
  env: Env,
  organization: CertOrg,
  memberId: number
) {
  return await env.Certs.prepare(
    'SELECT * FROM certs WHERE memberId=? AND organization=?'
  )
    .bind(memberId, organization)
    .first();
}

export async function certsFetchAll(env: Env, organization: CertOrg) {
  return await env.Certs.prepare('SELECT * FROM certs WHERE organization=?')
    .bind(organization)
    .all();
}

export async function certsBulkUpdate(env: Env, certs: iCert[]) {
  const insert = env.Certs.prepare(
    'INSERT OR REPLACE INTO certs VALUES (?, ?, ?, ?, ?, ?)'
  );
  const statements = certs.map(cert =>
    insert.bind(
      cert.memberId,
      cert.firstName,
      cert.lastName,
      cert.level,
      cert.expires,
      cert.organization
    )
  );

  return await env.Certs.batch(statements);
}
