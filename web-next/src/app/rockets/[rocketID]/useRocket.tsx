'use client';
import type { RocketProps } from '@flightcard/db';
import { useFetch } from '../../../../lib/useFetch';

export function useRocket(rocketID: string | string[] | undefined) {
  return useFetch<[typeof rocketID], RocketProps>(
    async ([rocketID]) => {
      if (typeof rocketID !== 'string') {
        return;
      }

      const res = await fetch(`/worker/rockets/${rocketID}`);
      return await res.json();
    },
    [rocketID]
  );
}
