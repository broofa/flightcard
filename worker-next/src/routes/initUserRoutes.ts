import { isUserProps } from '@flightcard/db';
import { CFQuery } from '../lib/CFQuery';
import { querySessionUser } from './initSessionRoutes';

export async function UpdateUser(req: Request, env: Env) {
  const currentUser = await querySessionUser(req, env);

  if (!currentUser) {
    return Response.json(null, { status: 400 });
  }

  const userProps = await req.json();
  if (!isUserProps(userProps)) {
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
    .where('userID', userID);

  const result = await query.run(env);

  return Response.json(result);
}
