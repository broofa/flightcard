'use client';

import Login from '@/app/Login';
import { useCurrentUser } from '@/app/useCurrentUser';

// Component that wraps UI that's only accessible to logged in users

export function LoginProtected({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {currentUser} = useCurrentUser();

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
