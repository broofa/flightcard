import { requestAccessToken, requestUserInfo } from '@/util/google-auth-utils';

const FLIGHTCARD_SESSION_COOKIE = 'flightcard-session';

export async function GET(request: Request) {
  return Response.json({
    time: new Date().toISOString(),
  });
}

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

  const userInfo = await requestUserInfo(accessToken.access_token);

  const res = Response.json(userInfo);
  res.headers.set(
    'Set-Cookie',
    `${FLIGHTCARD_SESSION_COOKIE}=${'HULLO'}; Path=/; HttpOnly; Secure; SameSite=Strict`
  );
  return res;
}
