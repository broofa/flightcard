import db, { iLaunchUser, iUser } from '../db';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSessionCookie } from './App';

const { minKey, maxKey } = Dexie;

export function useLaunchUsers(launchId : number) {
  const launchUsers = useLiveQuery(
    () => db.launchUsers
      .where('[launchId+userId]')
      .between([launchId, minKey], [launchId, maxKey])
      .toArray(),
    [launchId]
  ) || [];

  const userIds = launchUsers.length ? launchUsers.map(u => u.userId).sort() : [];

  const users = useLiveQuery(
    () => userIds.length ? db.users.where('id').anyOf(userIds).toArray() : null,
    [userIds.join()]
  ) || [];

  const lUsers : Record<string, iUser> = {};
  for (const u of users as iUser[]) {
    lUsers[u.id as number] = u;
  }

  if (launchUsers) {
    for (const lu of Object.values(launchUsers) as iLaunchUser[]) {
      const user = lUsers[lu.userId];
      if (user) user.launchUser = lu;
    }
  }

  return lUsers;
}

export function useLaunchUser(launchId, userId) {
  const key = [Number(launchId ?? -1), Number(userId ?? -1)];
  return useLiveQuery(() => (launchId && userId) ? db.launchUsers.get(key) : undefined, [key.join()]);
}

export function useCurrentUser() : iUser | undefined {
  const sess = getSessionCookie();
  const session = useLiveQuery(() => db.sessions.get({ id: sess }), [sess]);
  const userId = session?.userId;
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [sess, userId]);
  return user;
}

export function setCurrentUser(user : iUser | null) {
  const sessionId = getSessionCookie();
  if (!sessionId) return;

  if (!user) {
    db.sessions.where({ id: sessionId }).delete();
  } else {
    db.sessions.add({ id: sessionId, userId: user.id as number });
  }
}
