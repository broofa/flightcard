import type { RouteRequest } from '../lib/CloudflareRouter';

export async function UseError(req: RouteRequest) {
  try {
    return await req.next();
  } catch (err) {
    const { message, stack } = err as Error;

    console.error('Error while handling', req.url, err);
    return Response.json(
      {
        error: message,
        stack: stack?.split(/\n/g),
      },
      { status: 500 }
    );
  }
}
