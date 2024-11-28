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
  } else {
    res = await req.next();
  }

  res?.headers.set('Access-Control-Allow-Origin', origin);
  res?.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res?.headers.set('Access-Control-Allow-Credentials', 'true');
  res?.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  return res;
}

function isFlightCardOrigin(origin: string) {
  if (!origin) return true;

  let { hostname } = new URL(origin);
  hostname = hostname.toLowerCase();

  if (!hostname) return false;
  if (hostname === 'localhost') return true;
  if (hostname === 'flightcard.org') return true;
  if (hostname.endsWith('.vercel.app')) return true;

  return false;
}
