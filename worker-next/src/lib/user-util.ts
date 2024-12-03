import type { UserProps } from '@flightcard/db';
import type { UserModel } from '../routes/PostGoogleLogin';
import { CFQuery } from './CFQuery';

export async function upsertUser(env: Env, userProps: UserProps) {
  // Create user
  await new CFQuery()
    .insert('users')
    .values({
      userID: userProps,
      email: userProps.email,
      firstName: userProps.firstName,
      lastName: userProps.lastName,
      avatarURL: userProps.avatarURL,
      units: userProps.units,
    })
    .onConflict('email', 'NOTHING')
    .run(env);

  // Return new user
  return await new CFQuery()
    .select('*')
    .from('users')
    .where('email', userProps.email)
    .first<UserModel>(env);
}
