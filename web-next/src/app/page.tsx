'use client';

import Login from '@/app/Login';
import { LoginProtected } from '@/app/LoginProtected';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from '../../lib/session_hooks';

function useRealtimeLaunch() {
  useEffect(() => {
    const wsUrl = `${process.env.FC_API_ORIGIN}/launch/mock-launch-2/realtime`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log('Realtime connection established');
    };
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data, (_, v) => v ?? undefined);
      console.log('Realtime message:', payload);
    };
  }, []);
  return null;
}

export default function Home() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const realtimeConnection = useRealtimeLaunch();

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
          <h1>Hello, {currentUser.firstName}. Welcome to FlightCard.</h1>

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
