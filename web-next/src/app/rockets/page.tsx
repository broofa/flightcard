'use client';

import { useCurrentUser } from '@/app/useCurrentUser';
import type { RocketProps } from '@flightcard/db';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '../../../lib/Icon';

type RocketFormProps = RocketProps;

export default function RocketsIndex() {
  const [rockets, setRockets] = useState<RocketFormProps[]>();
  const { currentUser } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    fetchRockets().then(setRockets);
  }, []);

  return (
    <div className='grid p-8 gap-4' suppressHydrationWarning>
      <h1 className='text-2xl'>Your Rockets</h1>

      {rockets ? (
        <ul className='grid gap-2'>
          {rockets.map((rocket) => (
            <div
              key={rocket.rocketID}
              className='join bg-base-100 border flex flex-row'
            >
              <button
                className='join-item btn btn-sm grow'
                onClick={() => router.push(`/rockets/${rocket.rocketID}`)}
              >
                {rocket.name}
              </button>
              <button
                className='join-item btn btn-sm '
                onClick={() => router.push(`/rockets/${rocket.rocketID}/edit`)}
              >
                <Icon name='pencil-fill' />
              </button>
            </div>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}

      <div className='divider  w-full'>🚀</div>

      <div className='flex w-full'>
        <span className='grow' />

        <button
          className='btn btn-sm btn-primary'
          onClick={() => router.push('/rockets/new/edit')}
        >
          New Rocket
        </button>
      </div>
    </div>
  );
}

async function fetchRockets() {
  const res = await fetch('/worker/rockets');
  const { results } = await res.json();
  return results;
}
