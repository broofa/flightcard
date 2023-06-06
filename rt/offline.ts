import { RTPath } from './RTPath.js';
import { createMockData } from '/mock/mock_db.js';

const offlineDB = createMockData('ToMOmSnv7XVtygKOF9jjtwz0Kzs2');

offlineDB.users.demoid = {
  id: 'demoid',
  name: 'Demo McDemold',
  photoURL: '/svg/anonymous.svg',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DBListener = (val?: any) => void;

const _listeners = new Map<string, Set<DBListener>>();

export function addOfflineDataListener(rtPath: RTPath, listener: DBListener) {
  const path = rtPath.toString();
  let pathListeners = _listeners.get(path);
  if (!pathListeners) {
    pathListeners = new Set<DBListener>();
  }

  pathListeners.add(listener);

  return function () {
    pathListeners?.delete(listener);
  };
}

export function getOfflineData<T>(rtPath: RTPath): Promise<T> {
  const parts = rtPath.toString().substring(1).split('/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = offlineDB;
  for (const part of parts) {
    cursor = cursor[part];
  }
  return cursor as T;
}

// TODO: Detect when a parent node is being updated and ensure all subnode
// listeners get called.
export async function setOfflineData<T>(rtPath: RTPath, value: T) {
  const path = rtPath.toString();

  // Find node to set value on
  const parts = path.substring(1).split('/');

  if (parts.find(v => !v)) {
    throw Error(`"${path}" contains empty parts`);
  }
  if (parts.length < 2) {
    throw Error(`"${path}" does not resolve to a specific node`);
  }

  const key = parts.pop() as string;

  // Get Node to set value on (create objects along path as needed)
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = offlineDB;
  for (const part of parts) {
    if (cursor[part] === undefined) cursor[part] = {};
    cursor = cursor[part];
  }

  // Update value
  if (value === undefined) {
    delete cursor[key];
  } else {
    cursor[key] = value;
  }

  // Call listeners
  const listeners = _listeners.get(path);
  if (listeners) {
    for (const listener of listeners) {
      listener(value);
    }
  }
}
