'use client';

import { sessionCache, userCache } from '@/util/caches';
import type { SessionModel, UserModel } from '@flightcard/models';
import { useEffect, useState } from 'react';

export function useSession(sessionID = 'current') {
  const [currentSession, setCurrentSession] = useState<SessionModel>();
  useEffect(() => {
    sessionCache.get(sessionID).then(setCurrentSession);
    sessionCache.on(sessionID, setCurrentSession);
    return () => sessionCache.off(sessionID, setCurrentSession);
  }, []);

  return { currentSession };
}

export function useUser(userID?: string) {
  const [user, setUser] = useState<Readonly<UserModel>>();
  useEffect(() => {
    if (userID) {
      userCache.get(userID).then(setUser);
      userCache.on(userID, setUser);
      return () => userCache.off(userID, setUser);
    }
  }, [userID]);

  return user;
}

export function useCurrentUser() {
  const { currentSession } = useSession();
  return useUser(currentSession?.userID);
}
