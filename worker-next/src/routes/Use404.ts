import type { RouteRequest } from '../lib/CloudflareRouter';

export async function Use404(req: RouteRequest) {
  const res = await req.next();
  if (!res) {
    return Response.json({}, { status: 404 });
  }
  return res;
}
