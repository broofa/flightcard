import { Router } from './lib/CloudflareRouter';
import { GetFavicon } from './routes/GetFavicon';
import { PostGoogleLogin } from './routes/PostGoogleLogin';
import { Use404 } from './routes/Use404';
import { UseCors } from './routes/UseCors';
import { UseError } from './routes/UseError';
import { GetAdminMocks } from './routes/routes-admin';
import { GetLaunchRealtime } from './routes/routes-launch-do';
import { GetRocket, GetRockets, PostRockets } from './routes/routes-rockets';
import {
  DeleteSession,
  GetSession,
  GetSessionUser,
} from './routes/routes-session';
import { GetUser, UpdateUser } from './routes/routes-user';
export { LaunchDO } from './lib/LaunchDO';

const router = new Router();

// Middleware
router.use(UseError); // First!
router.use(UseCors);
router.use(Use404);

// Misc. routes
router.GET(/^\/favicon$/, GetFavicon);

// Login routes
router.POST(/^\/google-login$/, PostGoogleLogin);

// Session routes
router.GET(/^\/sessions\/current\/user$/, GetSessionUser);
router.GET(/^\/sessions\/(?<sessionID>[\w-]+)$/, GetSession);
router.DELETE(/^\/sessions\/current$/, DeleteSession);

// User routes
router.GET(/^\/users\/(?<userID>[\w-]+)$/, GetUser);
router.PATCH(/^\/users\/current$/, UpdateUser);

// Rocket routes
router.GET(/^\/rockets$/, GetRockets);
router.POST(/^\/rockets$/, PostRockets);
router.GET(/^\/rockets\/(?<rocketID>[\w-]+)$/, GetRocket);

// Launch routes
router.GET(/^\/launch\/(?<launchID>[\w-]+)\/realtime$/, GetLaunchRealtime);

// Admin routes
router.GET(/^\/admin\/mocks$/, GetAdminMocks);

export default {
  async fetch(
    request: Request,
    env: Env
    // ctx: ExecutionContext
  ): Promise<Response> {
    return router.handleRequest(request, env);
  },
};
