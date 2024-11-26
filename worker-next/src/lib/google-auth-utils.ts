const GOOGLE_USER_INFO_URI = 'https://www.googleapis.com/oauth2/v1/userinfo';
const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';

// Ref: `google-auth-library` package `CredentialRequest` type
export interface TokenResponse {
  refresh_token: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
  scope: string;
}

// REF: googleapis package, `Schema$Userinfo` typedef
export interface UserInfo {
  email?: string;
  family_name?: string;
  gender?: string;
  given_name?: string;
  hd?: string;
  id?: string;
  link?: string;
  locale?: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
}

export async function requestAccessToken(env: Env, authCode: string) {
  const url = new URL(GOOGLE_TOKEN_URI!);
  const params = new URLSearchParams({
    access_type: 'offline',
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    code: authCode,
    grant_type: 'authorization_code',
    redirect_uri: 'https://localhost:3000',
  });

  url.search = params.toString();
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  // TODO: Note: Doesn't include
  const tokenResponse: TokenResponse = await response.json();

  return tokenResponse;
}

export async function requestUserInfo(accessToken: string): Promise<UserInfo> {
  const url = new URL(GOOGLE_USER_INFO_URI);
  const params = new URLSearchParams({
    alt: 'json',
    access_token: accessToken,
  });
  url.search = params.toString();

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return await response.json();
}
