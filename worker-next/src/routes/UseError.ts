import type { RouteRequest } from '../lib/CloudflareRouter';

export async function UseError(req: RouteRequest) {
  try {
    return await req.next();
  } catch (err) {
    const { message, stack } = err as Error;

    console.error('Unhandled route error:', err);
    return Response.json(
      {
        error: message,
        stack: stack?.split(/\n/g),
      },
      { status: 500 }
    );
  }
}
