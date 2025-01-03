export const SESSION_PATH = '/sessions/:sessionID';
export const USER_PATH = '/users/:userID';
export const ROCKET_PATH = '/rockets/:rocketID';

if (!process.env.FC_API_ORIGIN) {
  throw new Error('FC_API_ORIGIN is not defined');
}

const apiOrigin = new URL(process.env.FC_API_ORIGIN);

export function apiUrl(path: string, tokens: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(tokens)) {
    path = path.replace(`:${key}`, value);
  }
  return new URL(path, apiOrigin).toString();
}

export async function fetchModel<T>(
  ...args: Parameters<typeof apiUrl>
): Promise<T> {
  const res = await fetch(apiUrl(...args), { credentials: 'include' });
  return (await res.json()) as T;
}
