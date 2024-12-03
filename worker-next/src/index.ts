import { Router } from './lib/CloudflareRouter';
import { GetFavicon } from './routes/GetFavicon';
import { PostGoogleLogin } from './routes/PostGoogleLogin';
import { Use404 } from './routes/Use404';
import { UseCors } from './routes/UseCors';
import { UseError } from './routes/UseError';
import { DeleteSession, GetSessionUser } from './routes/routes-session';
import { UpdateUser } from './routes/routes-user';

const router = new Router();

// Middleware
router.use(UseError); // First!
router.use(UseCors);
router.use(Use404);

// Misc. routes
router.GET('/favicon', GetFavicon);

// Login routes
router.POST('/google-login', PostGoogleLogin);

// Session routes
router.GET('/sessions/current/user', GetSessionUser);
router.DELETE('/sessions/current', DeleteSession);

// User routes
router.PATCH('/users/current', UpdateUser);

export default {
  async fetch(
    request: Request,
    env: Env
    // ctx: ExecutionContext
  ): Promise<Response> {
    return router.handleRequest(request, env);
  },
};
