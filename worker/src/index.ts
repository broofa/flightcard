import { updateNARCerts } from './nar/nar-util';
import { ROUTES } from './routes/routes';

export { LaunchDO } from './lib/LaunchDO';

export default {
  async fetch(
    request: Request,
    env: Env
    // ctx: ExecutionContext
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'access-control-allow-origin': request.headers.get('origin') ?? '',
    };

    // Process route handlers
    for (const route of ROUTES) {
      try {
        const result = await route(request, env);

        if (!result) {
        } else if (result instanceof Response) {
          return result;
        } else {
          return new Response(JSON.stringify(result, null, 2), { headers });
        }
      } catch (err) {
        console.log('Unhandled route error:', err);

        const { message, stack } = err as Error;

        return new Response(
          JSON.stringify({
            error: message,
            stack: stack?.split(/\n/g),
          }),
          { status: 500, headers }
        );
      }
    }

    return new Response('No route found for request', { status: 404, headers });
  },

  // Handle scheduled invocations
  //
  // NOTE: This can be triggered in dev by hitting http://127.0.0.1:1235/__scheduled
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(updateNARCerts(env));
  },
};
