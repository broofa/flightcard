'use client';

import Login from '@/app/Login';
import { LoginProtected } from '@/app/LoginProtected';
import { useCurrentUser } from '@/app/useCurrentUser';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { currentUser } = useCurrentUser();
  const router = useRouter();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div
      className='grid items-center justify-items-center p-8 pb-20 gap-16 sm:p-20'
      suppressHydrationWarning
    >
      <main className='flex flex-col gap-8 prow-start-2 items-center w-80'>
        <LoginProtected>
          <h1>
            Hello, {currentUser?.get('firstName')}. Welcome to FlightCard.
          </h1>
          <p>
            An application for fliers, organizers, and spectators at rocketry
            club launches.
          </p>

          <div className='grid grid-cols-2 gap-4 w-full'>
            <button className='btn' onClick={() => router.push('/rockets')}>
              Your Rockets
            </button>{' '}

            <button className='btn' disabled={true}>
              Attend a Launch
            </button>
            <button className='btn' disabled={true}>
              Host a Launch
            </button>
          </div>
        </LoginProtected>
      </main>
    </div>
  );
}
