import {
  type UserInfo,
  requestAccessToken,
  requestUserInfo,
} from '@/util/google-auth-utils';
import { CFDatabaseClient } from '@flightcard/db';

const FLIGHTCARD_SESSION_COOKIE = 'flightcard-session';

/**
 * Clients send this after authenticating with Google.  This creates / refreshes
 * the users account information, and establishes a session.
 */
export async function POST(request: Request) {
  const body: google.accounts.oauth2.CodeResponse = await request.json();

  const { code: authCode } = body;
  if (!authCode) {
    return Response.json({ error: 'Missing code' }, { status: 400 });
  }

  // Exchange the code for an access token
  const accessToken = await requestAccessToken(authCode);

  if (!accessToken) {
    return Response.json(
      { error: 'Failed to get access token' },
      { status: 400 }
    );
  }

  // Fetch user profile info
  const userInfo = await requestUserInfo(accessToken.access_token);

  // Create / update user account
  await updateUserInfo(userInfo);

  // Reply with something-sometihng
  const res = Response.json(userInfo);
  res.headers.set(
    'Set-Cookie',
    `${FLIGHTCARD_SESSION_COOKIE}=${'HULLO'}; Path=/; HttpOnly; Secure; SameSite=Strict`
  );
  return res;
}

async function updateUserInfo(userInfo: UserInfo) {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, FC_APP_DB } =
    process.env;

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !FC_APP_DB) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const db = new CFDatabaseClient(
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN,
    FC_APP_DB
  );

  const sql = `INSERT INTO users (email, firstName, lastName, avatarURL)
  VALUES (?1, ?2, ?3, ?4)
  ON CONFLICT(email) DO UPDATE SET firstName=?2, lastName=?3, avatarURL=?4
  ;`;

  // Create user
  await db.query(
    sql,
    userInfo.email,
    userInfo.given_name,
    userInfo.family_name,
    userInfo.picture
  );

  // Get user ID
  const result = await db.query(
    'SELECT userID FROM users WHERE email = ?1;',
    userInfo.email
  );

  console.log('GOT IT', JSON.stringify(result, null, 2));
}
