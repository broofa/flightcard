import { isUserModel } from '@flightcard/models';
import { CFQuery } from '../lib/CFQuery';
import type { RouteRequest } from '../lib/CloudflareRouter';
import { querySessionUser } from './routes-session';

export async function GetUser(req: RouteRequest, env: Env) {
  const { userID } = req.params as { userID: string };

  const query = new CFQuery()
    .select('*')
    .from('users')
    .where('userID = ?', userID);

  const result = await query.first(env);

  return Response.json(result);
}

export async function UpdateUser(req: RouteRequest, env: Env) {
  const currentUser = await querySessionUser(req, env);

  if (!currentUser) {
    return Response.json(null, { status: 401 });
  }

  const userProps = await req.json();
  if (!isUserModel(userProps)) {
    return Response.json(null, { status: 400 });
  }

  // CONSTRAINT: Users can only update their own profile
  if (userProps.userID !== currentUser.userID) {
    return Response.json(null, { status: 401 });
  }

  // Pluck props to update
  const { avatarURL, firstName, lastName, narID, traID, units, userID } =
    userProps;

  const query = new CFQuery()
    .update('users')
    .set({ avatarURL, firstName, lastName, narID, traID, units })
    .where('userID = ?', userID);

  const result = await query.run(env);

  return Response.json(result);
}
