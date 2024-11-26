'use client';

import type { UserModel } from '@flightcard/db';
import { useEffect, useState } from 'react';

export function useCurrentUser() {
  const [sessionID, setSessionID] = useState<string>();
  const [user, setUser] = useState<UserModel>();

  console.log('state', sessionID, user);

  useEffect(() => {
    console.log('Fetch user info here');
  }, [sessionID]);

  return [user, setSessionID] as const;
}
