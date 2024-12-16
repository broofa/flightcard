// Haven't been able to get @types/google.acccounts to work so just defining

import { requestAccessToken, requestUserInfo } from '../lib/google-util';

// @ts-ignore - TS can't find type declarations here.  Not sure why :-(
import { FC_SESSION_COOKIE, errorResponse, toss } from '@flightcard/common';
import { CFQuery } from '../lib/CFQuery';
import { upsertUser } from '../lib/user-util';

// this here for the time being
type CodeResponse = {
  code: string;
  scope: string;
  authuser: string;
  prompt: string;
};

export type UserModel = {
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
    return errorResponse('Failed to get access token', { status: 400 });
  }

  // Fetch user profile info
  const userInfo = await requestUserInfo(accessToken.access_token);

  // Create / update user account
  const user = await upsertUser(env, {
    userID: crypto.randomUUID(),
    email: userInfo.email ?? toss('No email in Google profile?!?'),
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    avatarURL: userInfo.picture,
    units: 'si',
  });

  if (!user) {
    return errorResponse('User upsert failed', { status: 400 });
  }

  const session = await createSession(env, user);
  if (!session) {
    return errorResponse('Session creation failed', { status: 400 });
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
