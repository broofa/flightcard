import db from '../db.js';
import { minKey, maxKey } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

export function useLaunchUsers(launchId) {
  launchId = launchId ?? Number(launchId);

  return useLiveQuery(() => launchId != null
    ? db.launchUsers
      .where('[launchId+userId]')
      .between([launchId, minKey], [launchId, maxKey])
      .toArray()
    : [],
  [launchId]);
}

export function useLaunchUser(launchId, userId) {
  const key = [Number(launchId ?? -1), Number(userId ?? -1)];
  return useLiveQuery(() => (launchId && userId) ? db.launchUsers.get(key) : null, [key.join()]);
}
