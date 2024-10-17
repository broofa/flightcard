/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:<port>/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

import { CertOrg, Env } from './cert_types';
import { certsFetch, certsFetchByName } from './db-util';
import { updateNARCerts } from './nar_certs';
import { updateTRACerts } from './tra_certs';

/**
 * Coudflare worker for fetching, parsing, and caching the list of Tripoli
 * members available at MEMBERS_URL (below).
 */

const DOMAIN_WHITELIST = /^(?:flightcard\.org|localhost)$/;

// Tripoli uses some special codes for their cert levels, which we need to map
// to the expected 0-3 values.
export const TRIPOLI_CERT_MAP: Record<string, string> = {
  // "Exam required" - Member's dues are paid, but they need to retake L2 exam
  // to reinstate their L2/L3 cert
  '3ER': '1',
  '2ER': '1',

  // Mentor L1
  M1: '1',

  // Same thing as M1???
  M: '1',
};

export class HTTPError extends Error {
  constructor(public message: string, public statusCode = 500) {
    super(message);
  }
}


const ROUTES = [
  async function rejectFavicon(request: Request) {
    if (/favicon/.test(request.url)) {return new Response(null, { status: 204 })};
  },

  async function corsPreflight(request: Request) {
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
  },

  async function scrapeStatusRoute(request: Request, env: Env) {
    const {pathname} = new URL(request.url);
    if (pathname !== '/members/meta') {
      return;
    }

    const [narInfo, traInfo] = await Promise.all([
      env.CertsKV.get('NAR.scanState'),
      env.CertsKV.get('TRA.fetchInfo'),
    ])

    const meta = {
      nar: narInfo ? JSON.parse(narInfo) : null,
      tra: traInfo ? JSON.parse(traInfo) : null,
    }

    return meta;
  },

  async function nameSearchRoute(request: Request, env: Env) {
    const { searchParams } = new URL(request.url);
    const firstName= searchParams.get('firstName') ?? undefined;
    const lastName = searchParams.get('lastName')?? undefined;

    if (!lastName) {
      return;
    }

    if (lastName.length < 2) {
      return new Response('Last name too short', { status: 400 });
    }

    return await certsFetchByName(env, lastName, firstName);
  },

  async function idSearchRoute(request: Request, env: Env) {
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
]

export default {
  async fetch(
    request: Request,
    env: Env,
    // ctx: ExecutionContext
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'access-control-allow-origin': request.headers.get('origin') ?? ''
    };

    // Process route handlers
    for (const route of ROUTES) {
      try {
        const result = await route(request, env);

        if (!result) {
          continue;
        } else if (result instanceof Response) {
          return result;
        } if (result) {
          return new Response(JSON.stringify(result, null, 2), { headers });
        }
      } catch (err) {
        const { message, stack } = err as Error;
        return new Response(
          JSON.stringify({
            error: message,
            stack: stack?.split(/\n/g),
          }),
          { status: 500, headers, }
        );
      }
    }

    return new Response('No route found for request', { status: 404, headers });
  },


  // Handle scheduled invocations
  //
  // NOTE: This can be triggered in dev by hitting http://127.0.0.1:6543/__scheduled
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(Promise.all([updateTRACerts(env), updateNARCerts(env)]));
  },
};
