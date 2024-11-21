import { Router } from './lib/CloudflareRouter';
import { GetFavicon } from './routes/GetFavicon';
import { PostGoogleLogin } from './routes/PostGoogleLogin';
import { Use404 } from './routes/Use404';
import { UseCors } from './routes/UseCors';
import { UseError } from './routes/UseError';

const router = new Router();

router.use(UseError); // First!
router.use(UseCors);
router.use(Use404);

router.GET('/favicon', GetFavicon);
router.POST('/google-login', PostGoogleLogin);

export default {
  async fetch(
    request: Request,
    env: Env
    // ctx: ExecutionContext
  ): Promise<Response> {
    return router.handleRequest(request, env);
  },
};
