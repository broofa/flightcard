'use client';

import { FC_SESSION_COOKIE } from '@flightcard/common';
import { UserModel } from '@flightcard/db';
import { useEffect, useState } from 'react';

const USER_CHANGE_EVENT = 'userChange';
const emitter = new EventTarget();
const emitUserChange = (user?: UserModel) => {
  const event = new CustomEvent(USER_CHANGE_EVENT, { detail: user });
  emitter.dispatchEvent(event);
};

export function useCurrentUser() {
  const [sessionID, setSessionID] = useState<string>();
  const [user, setUser] = useState<UserModel>();

  function userRefresh() {
    return fetchCurrentUser().then((newUser) => {
      if (newUser?.userID !== user?.userID) {
        setUser(newUser);
        emitUserChange(newUser);
      }
    });
  }

  function userLogout() {
    fetch(`${process.env.FC_API_ORIGIN}/sessions/current`, {
      method: 'DELETE',
      credentials: 'include',
    }).finally(userRefresh);
  }

  useEffect(() => {
    userRefresh();
    emitter.addEventListener(
      USER_CHANGE_EVENT,
      (ev: CustomEventInit<UserModel | undefined>) => setUser(ev.detail)
    );
    return () => emitter.removeEventListener(USER_CHANGE_EVENT, userRefresh);
  }, []);

  return [user, userRefresh, userLogout] as const;
}

function readSessionId() {
  return document.cookie.split(FC_SESSION_COOKIE + '=')[1];
}

let inflight: Promise<UserModel | undefined> | undefined;
async function fetchCurrentUser() {
  if (!inflight) {
    const url = `${process.env.FC_API_ORIGIN}/sessions/current/user`;
    inflight = fetch(url, { credentials: 'include' }).then(async (res) => {
      if (!res.ok) {
        console.error('Fetch failed, code=', res.status);
        return undefined;
      }
      const props = await res.json();
      if (!props) {
        return;
      }

      return new UserModel(props);
    });
    inflight.finally(() => {
      inflight = undefined;
    });
  }

  return await inflight;
}
