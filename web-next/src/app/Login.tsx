'use client';

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

  useEffect(() => {
    googleAPI.then(() => setIsLoading(false));
  }, []);

  return (
    <button
      disabled={isLoading}
      className='btn btn-primary w-full'
      onClick={googleLogin}
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

async function googleLogin() {
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
