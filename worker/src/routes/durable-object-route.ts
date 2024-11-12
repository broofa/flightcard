export default async function (request: Request, env: Env) {
  const { pathname } = new URL(request.url);
  if (pathname !== '/ws') {
    return;
  }

  // Get the Launch DO instance
  const id = env.LAUNCH_DO.idFromName('foo');
  const launchDO = env.LAUNCH_DO.get(id);

  return launchDO.fetch(request);
}
