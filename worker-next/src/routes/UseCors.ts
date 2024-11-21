import type { RouteRequest } from '../lib/CloudflareRouter';

export async function UseCors(req: RouteRequest) {
  const origin = req.headers.get('origin') ?? '';

  if (!origin) {
    return req.next();
  }

  const { hostname } = new URL(origin);

  // Reject requests from unknown origins
  if (!isFlightCardDomain(hostname)) {
    return Response.json({}, { status: 403 });
  }

  const res = await req.next();

  if (!(res instanceof Response)) {
    return res;
  }

  res.headers.set('access-control-allow-origin', origin);

  // Allow preflight requests that Chrome sends for localhost CORS requests
  if (req.method === 'OPTIONS') {
    res.headers.set('access-control-allow-methods', 'GET, OPTIONS');
    res.headers.set('access-control-allow-headers', 'Content-Type');
  }

  return res;
}

function isFlightCardDomain(domain: string) {
  domain = domain.toLowerCase();

  if (!domain) return false;
  if (domain === 'localhost') return true;
  if (domain === 'flightcard.org') return true;
  if (domain.endsWith('.vercel.app')) return true;

  return false;
}
