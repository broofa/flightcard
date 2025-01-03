type RouteHandler = (
  req: RouteRequest,
  env: Env
) => Promise<undefined | Response> | undefined | Response;

type Route = {
  handler: RouteHandler;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  pattern?: RegExp;
};

export type RouteRequest = Request & {
  parsedURL: URL;
  params?: Record<string, string>;
  next: () => ReturnType<RouteHandler>;
};

export class Router {
  routes: Route[] = [];

  use(handler: RouteHandler) {
    this.routes.push({ handler });
  }

  DELETE(pattern: RegExp, handler: RouteHandler) {
    this.routes.push({ method: 'DELETE', pattern, handler });
  }

  GET(pattern: RegExp, handler: RouteHandler) {
    this.routes.push({ method: 'GET', pattern, handler });
  }

  POST(pattern: RegExp, handler: RouteHandler) {
    this.routes.push({ method: 'POST', pattern, handler });
  }

  PUT(pattern: RegExp, handler: RouteHandler) {
    this.routes.push({ method: 'PUT', pattern, handler });
  }

  PATCH(pattern: RegExp, handler: RouteHandler) {
    this.routes.push({ method: 'PATCH', pattern, handler });
  }

  // Woot! Using a generator!
  *routesForRequest(req: RouteRequest) {
    for (const route of this.routes) {
      if (route.method && req.method !== route.method) continue;
      if (route.pattern) {
        const matches = req.parsedURL.pathname.match(route.pattern);
        if (!matches) continue;
        req.params = matches.groups ?? {};
      }

      yield route;
    }
  }

  async handleRequest(req: Request, env: Env): Promise<Response> {
    const routeRequest = req as RouteRequest;
    routeRequest.parsedURL = new URL(req.url);

    let i = 0;
    routeRequest.next = () => {
      let route: Route | undefined;
      while (!route && i < this.routes.length) {
        const rt = this.routes[i++];

        if (!rt.method) {
          // "use" middleware
          route = rt;
          break;
        }

        if (rt.method !== req.method) {
          continue;
        }

        if (!rt.pattern) {
          route = rt;
        } else {
          // method routes
          const matches = routeRequest.parsedURL.pathname.match(rt.pattern);
          if (matches) {
            routeRequest.params = matches.groups ?? {};
            route = rt;
          }
        }
      }

      if (route) {
        return route.handler(routeRequest, env);
      }
    };

    // Process route handlers
    const res = await routeRequest.next();

    if (!res) {
      throw new Error(
        `No response for route: ${routeRequest.parsedURL.pathname}`
      );
    }

    return res;
  }
}
