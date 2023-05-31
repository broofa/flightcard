import { CertOrg, Env, iCert } from './cert_types.js';

export async function certsFetch(
  env: Env,
  organization: CertOrg,
  memberId: number
) {
  return await env.CertsDB.prepare(
    'SELECT * FROM certs WHERE memberId=? AND organization=?'
  )
    .bind(memberId, organization)
    .first();
}

export async function certsFetchAll(env: Env, organization: CertOrg) {
  return await env.CertsDB.prepare('SELECT * FROM certs WHERE organization=?')
    .bind(organization)
    .all();
}

export async function certsLastUpdate(env: Env, organization: CertOrg) {
  return await env.CertsDB.prepare(
    'SELECT updated_at FROM certs WHERE organization=? ORDER BY updated_at DESC LIMIT 1'
  )
    .bind(organization)
    .first();
}

export async function certsBulkUpdate(env: Env, certs: iCert[]) {
  certs = certs.slice(0, 1);
  const insert = env.CertsDB.prepare(`
  INSERT OR REPLACE INTO certs
    (memberId, firstName, lastName, level, expires, organization)
  VALUES
    (?, ?, ?, ?, ?, ?)
  `);

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

  return await env.CertsDB.batch(statements);
}
