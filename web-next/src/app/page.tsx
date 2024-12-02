'use client';

import { LoginProtected } from '@/app/LoginProtected';
import { useCurrentUser } from '@/app/useCurrentUser';

export default function Home() {
  const [currentUser, refreshSession, deleteSession] = useCurrentUser();

  return (
    <div
      className='grid items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'
      suppressHydrationWarning
    >
      <main className='flex flex-col gap-8 prow-start-2 items-center w-80'>
        <h1>Welcome to FlightCard</h1>
        <LoginProtected>
          <>Hello, {currentUser?.get('firstName')}</>
          <button className='btn' onClick={deleteSession}>
            Logout
          </button>
        </LoginProtected>
      </main>
    </div>
  );
}
