'use client';

import { GOOGLE_SCOPES, type UserInfo } from '@/util/google-auth-utils';
import { useEffect, useState } from 'react';

async function googleLogin(onSignIn: (userInfo: UserInfo) => void) {
  const g: typeof google = await loadGoogleAuthAPI();

  const client = g.accounts.oauth2.initCodeClient({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    scope: GOOGLE_SCOPES.join(' '),
    ux_mode: 'popup',
    callback: async (response) => {
      const userInfoResponse = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response, null, 2),
      });
      const userInfo: UserInfo = await userInfoResponse.json();
      onSignIn?.(userInfo);
    },
  });

  client.requestCode();
}

// Loads google auth API.  The api is set as a window global, but we want to
// load it `async` + `defer`, which means we can't rely on it being available
// immediately.  So we load it dynamically and use the script#onload event to
// detect when it's available.
let _authAPIPromise: Promise<typeof google> | undefined;

function loadGoogleAuthAPI() {
  if (typeof window === 'undefined') {
    // Skip SSR
  }

  if (!_authAPIPromise) {
    // TODO: Reject after timeout
    _authAPIPromise = new Promise<typeof google>((resolve) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve(window.google);

      document.documentElement.appendChild(script);
    });
  }
  return _authAPIPromise;
}

export default function Login() {
  const [isClient, setIsClient] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>();

  useEffect(() => setIsClient(true), []);

  return isClient ? (
    <>
      <div className='g-signin2' data-onsuccess='onSignIn' />
      {userInfo ? (
        <pre>
          {JSON.stringify(userInfo, null, 2)}
          <img
            src={userInfo.picture}
            alt='profile'
            style={{ borderRadius: '1em' }}
          />
          <div>
            {userInfo.given_name} {userInfo.family_name}
          </div>
        </pre>
      ) : null}
      <button
        className='btn btn-primary w-full'
        onClick={() => googleLogin(setUserInfo)}
      >
        Login With Google
      </button>
    </>
  ) : (
    <h1>CLIENT ONLY</h1>
  );
}
