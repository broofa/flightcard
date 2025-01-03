import { SESSION_PATH, apiUrl } from '@/util/api-util';
import { sessionCache } from '@/util/caches';

export async function deleteCurrentSession() {
  await fetch(apiUrl(SESSION_PATH, { sessionID: 'current' }), {
    method: 'DELETE',
    credentials: 'include',
  });

  sessionCache.put('current', undefined);
}
