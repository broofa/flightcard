import { CertOrg } from '../../types_certs';
import { certsFetch, certsFetchByName } from './db-util';
import { traUpdate } from './tra-util';

const DOMAIN_WHITELIST = /^(?:flightcard\.org|localhost)$/;

export type Route = (req: Request, env: Env) => Promise<unknown>;

export async function rejectFaviconRoute(request: Request) {
  if (/favicon/.test(request.url)) {
    return new Response(null, { status: 204 });
  }
}

export async function corsPreflightRoute(request: Request) {
  const origin = request.headers.get('origin') ?? '';

  if (!origin) return;

  const { hostname } = new URL(origin);

  // Reject requests from unknown origins
  if (!DOMAIN_WHITELIST.test(hostname)) {
    return new Response(null, { status: 403 });
  }

  // Allow preflight requests that Chrome sends for localhost CORS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'Content-Type',
      },
    });
  }
}

export async function durableObjectRoute(request: Request, env: Env) {
  const { pathname } = new URL(request.url);
  if (pathname !== '/ws') {
    return;
  }

  // Get the Launch DO instance
  const id = env.LAUNCH_DO.idFromName('foo');
  const launchDO = env.LAUNCH_DO.get(id);

  return launchDO.fetch(request);
}

export async function membersUploadRoute(request: Request, env: Env) {
  const { pathname } = new URL(request.url);
  if (pathname !== '/members' || request.method !== 'POST') {
    return;
  }

  const data: { key: string; membersCSV: string } = await request.json();

  if (!data.key || data.key !== env.FC_API_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('Received ', data.membersCSV.length, 'bytes of data');

  await traUpdate(data.membersCSV, env);

  return new Response('OK');
}

export async function membersMetaRoute(request: Request, env: Env) {
  const { pathname } = new URL(request.url);
  if (pathname !== '/members/meta') {
    return;
  }

  const [narInfo, traInfo] = await Promise.all([
    env.CertsKV.get('NAR.scanState'),
    env.CertsKV.get('TRA.fetchInfo'),
  ]);

  const meta = {
    nar: narInfo ? JSON.parse(narInfo) : null,
    tra: traInfo ? JSON.parse(traInfo) : null,
  };

  return meta as unknown;
}

export async function nameSearchRoute(request: Request, env: Env) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get('firstName') ?? undefined;
  const lastName = searchParams.get('lastName') ?? undefined;

  if (!lastName) {
    return;
  }

  if (lastName.length < 2) {
    return new Response('Last name too short', { status: 400 });
  }

  return await certsFetchByName(env, lastName, firstName);
}

export async function idSearchRoute(request: Request, env: Env) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const org = searchParams.get('org');

  if (!id || !org) {
    return;
  }

  const memberId = parseInt(id);

  if (isNaN(memberId)) {
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
