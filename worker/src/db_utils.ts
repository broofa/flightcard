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

export async function certsBulkUpdate(env: Env, certs: iCert[]) {
  if (!certs.length) return;

  const insert = env.CertsDB.prepare(`
  INSERT OR REPLACE INTO certs
    (memberId, firstName, lastName, level, expires, organization)
  VALUES
    (?, ?, ?, ?, ?, ?)
  `);

  const org = certs[0].organization;

  const start = Date.now();

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

  const results = await env.CertsDB.batch(statements);
  console.log(
    `Updated ${certs.length} ${org} certs in ${Date.now() - start} ms`
  );
  return results;
}
