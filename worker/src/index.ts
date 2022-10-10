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

import { CertOrg, Env, iCert } from './cert_types';
import { updateTripoliCerts } from './cert_utils_tra';

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

async function handleRequest(request: Request, env: Env) {
  // Ignore requests (from browser) for favicons
  if (/favicon/.test(request.url)) return;

  const { searchParams } = new URL(request.url);
  const memberId = parseInt(searchParams.get('id') ?? '');
  const org = searchParams.get('org') ?? CertOrg.TRA;

  if (isNaN(memberId)) {
    throw new HTTPError('Invalid ID', 400);
  }

  if (org !== CertOrg.NAR && org !== CertOrg.TRA) {
    throw new HTTPError('Invalid org', 400);
  }
  const key = `${org}:${memberId}`;
  console.log('KEY', key);
  const cert = await env.HPRCerts.get<iCert>(key, { type: 'json' });

  if (!cert) {
    throw new HTTPError('Member not found', 404);
  }

  return cert;
}

export default {
  // Handle HTTP requests to this worker.  We have a bit of boiler-late code
  // here to ensure we always return a JSON response with proper CORS headers
  async fetch(
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    env: Env,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: ExecutionContext
  ): Promise<Response> {
    // Compose response headers.  Use CORS to restrict to development and
    // production environments
    const origin = request.headers.get('origin') ?? 'invalid://';
    const { hostname } = new URL(origin);
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'access-control-allow-origin': DOMAIN_WHITELIST.test(hostname)
        ? origin
        : '',
    };

    // Invoke handler.  We wrap this in some basic boilerplate to insure we
    // _always_ return a JSON response, and to make error handling simple and
    // robust.
    try {
      const body = await handleRequest(request, env);
      return new Response(JSON.stringify(body, null, 2), { headers });
    } catch (err) {
      const { message, statusCode, stack } = err as HTTPError;
      return new Response(
        JSON.stringify({
          error: message,
          stack: statusCode ? undefined : stack?.split(/\n/g),
        }),
        {
          status: statusCode ?? 500,
          headers,
        }
      );
    }
  },

  // Handle scheduled invocations
  //
  // NOTE: This can be triggered in dev by hitting  http://localhost:8787/cdn-cgi/mf/scheduled

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(Promise.all([updateTripoliCerts(env)]));
  },
};
