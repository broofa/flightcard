// REF: https://developers.google.com/identity/protocols/oauth2/scopes
export const GOOGLE_SCOPES = [
  // 'https://www.googleapis.com/auth/userinfo.email',
  // 'https://www.googleapis.com/auth/userinfo.profile',
  'email',
  'profile',
];

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

export async function requestAccessToken(authCode: string) {
  const url = new URL(GOOGLE_TOKEN_URI!);
  const params = new URLSearchParams({
    access_type: 'offline',
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code: authCode,
    grant_type: 'authorization_code',
    redirect_uri: 'https://localhost:3000',
  });

  url.search = params.toString();
  console.log('*** URL', url.toString());
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

// Loads google API
let googleLoginPromise: Promise<typeof google> | undefined;
function loadGoogleAuth() {
  if (typeof window === 'undefined') {
    // Skip SSR
  }

  if (!googleLoginPromise) {
    // TODO: Reject after timeout
    googleLoginPromise = new Promise<typeof google>((resolve) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve(window.google);

      document.documentElement.appendChild(script);
    });
  }
  return googleLoginPromise;
}
