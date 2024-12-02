export type Route = (
  req: RouteRequest,
  env: Env
) => Promise<undefined | Response> | undefined | Response;

export type RouteRequest = Request & {
  parsedURL: URL;
  next: () => ReturnType<Route>;
};

export class Router {
  routes: Route[] = [];

  use(route: Route) {
    this.routes.push(route);
  }

  DELETE(path: string, route: Route) {
    this.use(async (req, env) => {
      if (req.method === 'DELETE' && req.parsedURL.pathname === path) {
        return route(req, env);
      }
      return req.next();
    });
  }

  GET(path: string, route: Route) {
    this.use(async (req, env) => {
      if (req.method === 'GET' && req.parsedURL.pathname === path) {
        return route(req, env);
      }
      return req.next();
    });
  }

  POST(path: string, route: Route) {
    this.use(async (req, env) => {
      if (req.method === 'POST' && req.parsedURL.pathname === path) {
        return route(req, env);
      }
      return req.next();
    });
  }

  PATCH(path: string, route: Route) {
    this.use(async (req, env) => {
      if (req.method === 'PATCH' && req.parsedURL.pathname === path) {
        return route(req, env);
      }
      return req.next();
    });
  }

  async handleRequest(req: Request, env: Env): Promise<Response> {
    console.log('HANDLING', req.url);
    const routeRequest = req as RouteRequest;
    routeRequest.parsedURL = new URL(req.url);

    let i = 0;
    routeRequest.next = () => {
      const nextRoute = this.routes[i++];
      if (!nextRoute) return;
      return nextRoute(routeRequest, env);
    };

    // Process route handlers
    const res = await routeRequest.next();

    if (!res) {
      // If we get here, it means there's no error handler route and/or no 404
      // handler
      throw new Error(`Unhandled route @ ${routeRequest.parsedURL.pathname}`);
    }

    return res;
  }
}
