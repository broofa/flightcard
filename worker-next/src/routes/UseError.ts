import { errorResponse } from '@flightcard/common';
import type { RouteRequest } from '../lib/CloudflareRouter';

export async function UseError(req: RouteRequest) {
  try {
    return await req.next();
  } catch (err) {
    console.error('Error while handling', req.url, err);
    return errorResponse(err, { status: 500 });
  }
}
