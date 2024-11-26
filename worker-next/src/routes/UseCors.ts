import type { RouteRequest } from '../lib/CloudflareRouter';

export async function UseCors(req: RouteRequest) {
  const origin = req.headers.get('origin') ?? '';

  // Reject requests from unknown origins
  if (!isFlightCardOrigin(origin)) {
    return Response.json({}, { status: 403 });
  }

  let res: Response | undefined;
  if (req.method === 'OPTIONS') {
    res = new Response(null, { status: 200 });
    res.headers.set('access-control-allow-methods', 'GET, OPTIONS');
    res.headers.set(
      'access-control-allow-headers',
      'Content-Type, Authorization'
    );
  } else {
    res = await req.next();
  }

  res?.headers.set('access-control-allow-origin', origin);

  return res;
}

function isFlightCardOrigin(origin: string) {
  let { hostname } = new URL(origin);
  if (!hostname) return true;

  hostname = hostname.toLowerCase();

  if (!hostname) return false;
  if (hostname === 'localhost') return true;
  if (hostname === 'flightcard.org') return true;
  if (hostname.endsWith('.vercel.app')) return true;

  return false;
}
