'use client';

import Login from '@/app/Login';
import { useCurrentUser } from '../../lib/session_hooks';

// Component that wraps UI that's only accessible to logged in users

export function LoginProtected({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = useCurrentUser();
  console.log('currentUser', currentUser);

  if (!currentUser) {
    return (
      <>
        <h1>Welcome to FlightCard</h1>
        <Login />
      </>
    );
  }

  return <>{children}</>;
}
