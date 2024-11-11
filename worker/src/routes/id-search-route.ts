import { CertOrg } from '../../types_certs';
import { certsFetch } from '../lib/db-util';

export default async function (request: Request, env: Env) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const org = searchParams.get('org');

  if (!id || !org) {
    return;
  }

  const memberId = Number.parseInt(id);

  if (Number.isNaN(memberId)) {
    return new Response('Invalid ID', { status: 400 });
  }

  if (org !== CertOrg.NAR && org !== CertOrg.TRA) {
    return new Response('Invalid org', { status: 400 });
  }

  const cert = await certsFetch(env, org, memberId);

  if (!cert) {
    return new Response('Member not found', { status: 404 });
  }

  return cert;
}
