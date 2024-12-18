'use client';

import { useRouter } from 'next/navigation';

export default function RocketsIndexPage({
  params,
}: {
  params: Promise<{ rocketID: string }>;
}) {
  const router = useRouter();
  const rocketID = params.then((...args) => console.log('ARGS', args));

  return (
    <div className='grid p-8 gap-4' suppressHydrationWarning>
      <h1 className='text-2xl'>{} Rocket</h1>
    </div>
  );
}
