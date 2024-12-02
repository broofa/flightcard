// Haven't been able to get @types/google.acccounts to work so just defining

import {
  type UserInfo,
  requestAccessToken,
  requestUserInfo,
} from '../lib/google-auth-utils';

// @ts-ignore - TS can't find type declarations here.  Not sure why :-(
import { FC_SESSION_COOKIE } from '@flightcard/common/constants.ts';
import { CFQuery } from '../lib/CFQuery';

// this here for the time being
type CodeResponse = {
  code: string;
  scope: string;
  authuser: string;
  prompt: string;
};

type UserModel = {
  userID: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarURL: string;
  createdAt: number;
};

type SessionModel = {
  sessionID: string;
  userID: string;
  expiresAt: number;
};

export async function PostGoogleLogin(
  req: Request,
  env: Env
): Promise<undefined | Response> {
  // const body: google.accounts.oauth2.CodeResponse = await request.json();
  const body: CodeResponse = await req.json();

  const { code: authCode } = body;

  // Exchange the code for an access token
  const accessToken = await requestAccessToken(env, body.code);

  if (!accessToken) {
    return Response.json(
      { error: 'Failed to get access token' },
      { status: 400 }
    );
  }

  // Fetch user profile info
  const userInfo = await requestUserInfo(accessToken.access_token);

  // Create / update user account
  const user = await updateUser(env, userInfo);
  if (!user) {
    return Response.json({ error: 'User upsert failed' }, { status: 400 });
  }

  const session = await createSession(env, user);
  if (!session) {
    return Response.json({ error: 'Session creation failed' }, { status: 400 });
  }

  const maxAge = Math.floor(session.expiresAt - Date.now() / 1000);

  const cookieAtts = [
    `${FC_SESSION_COOKIE}=${session.sessionID}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    // 'HttpOnly',
    'Secure',
    'SameSite=None',
  ];

  const res = Response.json(userInfo);
  res.headers.set('Set-Cookie', cookieAtts.join('; '));
  return res;
}

async function updateUser(env: Env, userInfo: UserInfo) {
  const db = env.AppDB;

  const userID = crypto.randomUUID();
  const {
    email,
    given_name: firstName,
    family_name: lastName,
    picture: avatarURL,
  } = userInfo;

  // Create user
  await new CFQuery()
    .insert('users')
    .values({
      userID,
      email,
      firstName,
      lastName,
      avatarURL,
    })
    .onConflict('email')
    .set({
      firstName,
      lastName,
      avatarURL,
    })
    .run(env);

  // Return new user
  return await new CFQuery()
    .select('*')
    .from('users')
    .where('email', userInfo.email)
    .first<UserModel>(env);
}

async function createSession(env: Env, user: UserModel) {
  const db = env.AppDB;

  // Create session
  const sessionID = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await new CFQuery()
    .insert('sessions')
    .values({
      sessionID,
      userID: user.userID,
      expiresAt: expiresAt.toISOString(),
    })
    .run(env);

  return await new CFQuery()
    .select('*')
    .from('sessions')
    .where('sessionID', sessionID)
    .first<SessionModel>(env);
}
