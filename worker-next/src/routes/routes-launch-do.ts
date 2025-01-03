import { errorResponse } from '@flightcard/common';
import type { RouteRequest } from '../lib/CloudflareRouter';

export async function GetLaunchRealtime(req: RouteRequest, env: Env) {
  const { launchID } = req.params as { launchID: string };

  const id = env.FC_LAUNCH_DO.idFromName(launchID);
  const stub = env.FC_LAUNCH_DO.get(id);

  try {
    return await stub.fetch(req);
  } catch (err) {
    console.error('Error while handling', req.url, err);
    return errorResponse(err, { status: 500 });
  }
}
