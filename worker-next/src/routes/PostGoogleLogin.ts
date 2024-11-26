// Haven't been able to get @types/google.acccounts to work so just defining

import {
  type UserInfo,
  requestAccessToken,
  requestUserInfo,
} from '../lib/google-auth-utils';

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

export const FLIGHTCARD_SESSION_COOKIE = '_fcid';

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

  console.log('session', session);
  const maxAge = Math.floor(session.expiresAt - Date.now() / 1000);

  const cookieAtts = [
    `${FLIGHTCARD_SESSION_COOKIE}=${session.sessionID}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
  ];

  const res = Response.json(userInfo);
  res.headers.set('Set-Cookie', cookieAtts.join('; '));
  return res;
}

async function updateUser(env: Env, userInfo: UserInfo) {
  const db = env.AppDB;

  const userID = crypto.randomUUID();

  // Create user
  await db
    .prepare(`INSERT INTO users (userID, email, firstName, lastName, avatarURL)
    VALUES (?1, ?2, ?3, ?4, ?5)
    ON CONFLICT(email) DO UPDATE SET firstName=?2, lastName=?3, avatarURL=?4
    ;`)
    .bind(
      userID,
      userInfo.email,
      userInfo.given_name,
      userInfo.family_name,
      userInfo.picture
    )
    .run();

  return await db
    .prepare('SELECT * FROM users WHERE email = ?1;')
    .bind(userInfo.email)
    .first<UserModel>();
}

async function createSession(env: Env, user: UserModel) {
  const db = env.AppDB;

  // Create session
  const sessionID = crypto.randomUUID();
  const expiresAt = Date.now() / 1000 + 30 * 24 * 60 * 60; // Seconds
  await db
    .prepare(`INSERT INTO sessions (sessionID, userID, expiresAt)
      VALUES (?1, ?2, ?3);`)
    .bind(sessionID, user.userID, expiresAt)
    .run();

  // Return new session id model
  return await db
    .prepare('SELECT * FROM sessions WHERE sessionID = ?1;')
    .bind(sessionID)
    .first<SessionModel>();
}
