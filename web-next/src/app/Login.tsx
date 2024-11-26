'use client';

import { useCurrentUser } from '@/app/useCurrentUser';
import { FLIGHTCARD_SESSION_COOKIE } from '@flightcard/common/constants.js';
import { useEffect, useState } from 'react';

// REF: https://developers.google.com/identity/protocols/oauth2/scopes
export const GOOGLE_SCOPES = [
  // 'https://www.googleapis.com/auth/userinfo.email',
  // 'https://www.googleapis.com/auth/userinfo.profile',
  'email',
  'profile',
];

export default function Login() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setSessionID] = useCurrentUser();

  useEffect(() => {
    googleAPI.then(() => setIsLoading(false));
  }, []);

  return (
    <button
      disabled={isLoading}
      className='btn btn-outline w-50'
      onClick={doGoogleLogin}
    >
      <img src='google.svg' alt='Google Logo' className='w-6 h-6' />
      Login With Google
    </button>
  );
}

// Load google accounts API asynchronously
const googleAPI = (() => {
  // TODO: Reject after timeout
  return new Promise<typeof google | undefined>((resolve) => {
    if (typeof document === 'undefined') {
      return Promise.resolve(undefined);
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve(window.google);

    document.documentElement.appendChild(script);
  });
})();

async function doGoogleLogin() {
  const g = await googleAPI;

  if (!g) {
    console.error('Google API not loaded');
    return;
  }

  const client = g.accounts.oauth2.initCodeClient({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    scope: GOOGLE_SCOPES.join(' '),
    ux_mode: 'popup',
    callback: async (response) => {
      const userInfoResponse = await fetch('/worker/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response, null, 2),
      });

      updateCurrentUser();
    },
  });

  client.requestCode();
}

function updateCurrentUser() {
  const sessionID = document.cookie.split(FLIGHTCARD_SESSION_COOKIE + '=')[1];
  console.log('SESSSSIONID', document.cookie);
}
