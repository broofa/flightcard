'use client';

import { rocketCache } from '@/util/caches';
import { type RocketModel, filteredCache } from '@flightcard/models';
import { useEffect, useState } from 'react';

export function useUserRockets(userID?: string) {
  const [rockets, setRockets] = useState<RocketModel[]>([]);

  useEffect(() => {
    const filtered = filteredCache<RocketModel>(
      rocketCache,
      (r) => r?.userID === userID,
      (
        newModel: RocketModel | undefined,
        oldModel: RocketModel | undefined
      ) => {
        setRockets([...filtered]);
      }
    );

    setRockets([...filtered]);

    return () => filtered.off();
  }, [userID]);

  return rockets;
}
