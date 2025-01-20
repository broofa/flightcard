import type { UserModel } from '@flightcard/models';
import { CFQuery } from './CFQuery';

export async function upsertUser(env: Env, userModel: UserModel) {
  // Create user
  await new CFQuery()
    .insertInto('users')
    .values({
      userID: userModel.userID,
      email: userModel.email,
      firstName: userModel.firstName,
      lastName: userModel.lastName,
      avatarURL: userModel.avatarURL,
      units: userModel.units,
    })
    .onConflictDo('email', 'NOTHING')
    .run(env);

  // Return new user
  return await new CFQuery<UserModel>()
    .select('*')
    .from('users')
    .where('email = ?', userModel.email)
    .first(env);
}
