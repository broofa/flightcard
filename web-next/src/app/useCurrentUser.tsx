'use client';

import { UserModel, type UserProps } from '@flightcard/db';
import useSWR from 'swr';

const CURRENT_SESSION_URL = `${process.env.FC_API_ORIGIN}/sessions/current`
const CURRENT_SESSION_USER_URL = `${CURRENT_SESSION_URL}/user`

export function useCurrentUser() {
  const userFetch = useSWR(CURRENT_SESSION_URL, fetchCurrentUser);

  function logout() {
    fetch(CURRENT_SESSION_URL, {
      method: 'DELETE',
      credentials: 'include',
    }).finally(userFetch.mutate);
  }

  return {
    currentUser: userFetch.data,
    refresh: userFetch.mutate,
    logout,
  } as const;
}

async function fetchCurrentUser() {
  const res = await fetch(CURRENT_SESSION_USER_URL, { credentials: 'include' });

  if (!res.ok) {
    throw new Error(`Fetch failed, code=${res.status}`);
  }

  const userProps: UserProps = await res.json();
  if (!userProps) {
    return;
  }

  return new UserModel(userProps);
}
