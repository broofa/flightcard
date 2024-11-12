import { certsFetchByName } from '../lib/db-util';

export default async function (request: Request, env: Env) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get('firstName') ?? undefined;
  const lastName = searchParams.get('lastName') ?? undefined;

  if (!lastName) {
    return;
  }

  if (lastName.length < 2) {
    return new Response('Last name too short', { status: 400 });
  }

  return await certsFetchByName(env, lastName, firstName);
}
