'use client';
import type { RocketModel } from '@flightcard/models';
import { useFetch } from '../../../../lib/useFetch';

export function useRocket(rocketID: string | string[] | undefined) {
  return useFetch<[typeof rocketID], RocketModel>(
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
