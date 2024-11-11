export default async function (request: Request, env: Env) {
  const { pathname } = new URL(request.url);
  if (pathname !== '/members/meta') {
    return;
  }

  const [narInfo, traInfo] = await Promise.all([
    env.CertsKV.get('NAR.scanState'),
    env.CertsKV.get('TRA.fetchInfo'),
  ]);

  const meta = {
    nar: narInfo ? JSON.parse(narInfo) : null,
    tra: traInfo ? JSON.parse(traInfo) : null,
  };

  return meta as unknown;
}
