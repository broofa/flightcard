'use client';

import { useRocket } from '@/app/rockets/[rocketID]/useRocket';
import { useParams, useRouter } from 'next/navigation';
import type { HTMLProps } from 'react';
import { BusySpinner } from '../../../../lib/Busy';
import ColorChits from '../../../../lib/ColorChits';
import { cn } from '../../../../lib/cn';

export default function RocketsIndexPage() {
  const router = useRouter();
  const { rocketID } = useParams();
  const rocketFetch = useRocket(rocketID);

  if (!rocketID) {
    return <div>Invalid rocket ID</div>;
  }

  if (rocketFetch.isLoading) {
    return <BusySpinner />;
  }

  const rocket = rocketFetch.data;

  if (!rocket) {
    return <h2>No rocket found</h2>;
  }

  return (
    <div className='grid p-8 gap-4' suppressHydrationWarning>
      <h1 className='text-2xl'>
        {rocket.name ?? 'Unamed'}{' '}
        <span className='text-base'>
          ({rocket.extra?.manufacturer || 'scratch built'})
        </span>
      </h1>

      <div className='grid grid-cols-3 gap-4'>
        <Field
          label=''
          value={`${rocket.extra?.diameter} cm L x ${rocket.extra?.length} cm D`}
        />
        <Field label='' value={rocket.extra?.mass + ' kg'} />
        <Field
          className='capitalize'
          label='Recovery'
          value={rocket.extra?.recovery}
        />
        <div className='flex flex-col'>
          <div>Description: {rocket.extra?.description}</div>
          <div className='flex flex-row'>
            <ColorChits
              colors={rocket.extra?.description || ''}
              className='grow h-2'
            />
          </div>
        </div>
      </div>

      <div className='divider  w-full'>🚀</div>

      <div className='flex w-full'>
        <span className='grow' />

        <button
          className='btn btn-sm btn-primary'
          onClick={() => router.push(`/rockets/${rocket.rocketID}/edit`)}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: { label: string; value?: string | number } & HTMLProps<HTMLDivElement>) {
  return (
    <div className='flex text-nowrap'>
      {label ? (
        <>
          <span className='grow-0'>{label}: </span>
          <span className={cn(className, 'grow ps-2')}>{value ?? ''}</span>
        </>
      ) : (
        <span className={cn(className, 'grow')}>{value ?? ''}</span>
      )}
    </div>
  );
}
