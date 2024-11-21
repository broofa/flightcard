import type { RouteRequest } from '../lib/CloudflareRouter';

export function GetFavicon(req: RouteRequest) {
  if (req.parsedURL.pathname.startsWith('/favicon')) {
    return Response.redirect(
      'https://flightcard.org//favicon.17674ec3.png',
      302
    );
  }
}
