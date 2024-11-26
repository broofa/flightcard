export default function (req: Request) {
  const origin = req.headers.get('origin') ?? '';

  if (!origin) return;

  const { hostname } = new URL(origin);

  // Reject requests from unknown origins
  if (!isFlightCardDomain(hostname)) {
    return new Response(null, { status: 403 });
  }

  // Allow preflight requests that Chrome sends for localhost CORS requests
  if (req.method === 'OPTIONS') {
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

function isFlightCardDomain(domain: string) {
  domain = domain.toLowerCase();

  if (!domain) return false;
  if (domain === 'localhost') return true;
  if (domain === 'flightcard.org') return true;
  if (domain.endsWith('.vercel.app')) return true;

  return false;
}
