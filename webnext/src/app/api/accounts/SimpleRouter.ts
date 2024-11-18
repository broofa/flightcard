type RouteHandler = (request: Request) => Promise<Response>;
type RoutePattern = string | RegExp;
type Route = {
  method: string;
  pattern: RoutePattern;
  handler: RouteHandler;
};

interface RouteRequest extends Request {
  params: Record<string, string>;
}

/**
 * SimpleRouter is a simple router for handling API requests.  Routes may be
 * plain strings or regular expressions.  Plains strings must match the URL path
 * exactly. Regular expressions are tested with String#match(), with named
 * capturing groups captured in the request.params object. For example:
 *
 * const router = new SimpleRouter();
 *
 * router.get('/foo', (request) => {...});
 *
 * router.get('/foo/(?<id>\w+)', (request) => {
 *   return Response.json({ id: request.params.id });
 * });
 *
 * await router.handleRequest(request);
 */
export default class SimpleRouter {
  routes: Route[] = [];

  #addRoute(method: string, pattern: RoutePattern, handler: RouteHandler) {
    this.routes.push({ method, pattern, handler });
    return this;
  }

  get(pattern: RoutePattern, handler: RouteHandler) {
    return this.#addRoute('GET', pattern, handler);
  }

  post(pattern: RoutePattern, handler: RouteHandler) {
    return this.#addRoute('POST', pattern, handler);
  }

  put(pattern: RoutePattern, handler: RouteHandler) {
    return this.#addRoute('PUT', pattern, handler);
  }

  delete(pattern: RoutePattern, handler: RouteHandler) {
    return this.#addRoute('DELETE', pattern, handler);
  }

  patch(pattern: RoutePattern, handler: RouteHandler) {
    return this.#addRoute('PATCH', pattern, handler);
  }

  options(pattern: RoutePattern, handler: RouteHandler) {
    return this.#addRoute('OPTIONS', pattern, handler);
  }

  findRoute(request: Request) {
    let routeMatch: Route | undefined;
    for (const route of this.routes) {
      if (typeof route.pattern === 'string') {
        if (route.pattern !== request.url) {
          continue;
        }
      }

      const match = request.url.match(route.pattern);
      if (match) {
        routeMatch = route;
        // Exact match = stop here
        if (route.method === request.method) {
          break;
        }
      }
    }

    return routeMatch;
  }

  handleRequest(request: Request) {
    const route = this.findRoute(request);

    if (!route) {
      return Response.json(
        { error: { message: 'Not found' } },
        { status: 404 }
      );
    }

    if (route.method !== request.method) {
      return Response.json(
        { error: { message: 'Method not allowed' } },
        { status: 405 }
      );
    }

    try {
      return route.handler(request);
    } catch (error) {
      const { message } = error as Error;
      return Response.json({ error: { message } }, { status: 500 });
    }
  }
}
