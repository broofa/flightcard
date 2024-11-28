import { FC_SESSION_COOKIE } from '@flightcard/common/constants.ts';
import type { UserModel } from '@flightcard/db';
import { parse } from 'cookie';
import type { Router } from '../lib/CloudflareRouter';

// Get user for the current sesssion cookie

export function initSessionRoutes(router: Router) {
  router.GET('/sessions/current/user', GetSessionUser);
  router.DELETE('/sessions/current', DeleteSession);
}

export async function GetSessionUser(req: Request, env: Env) {
  const cookie = parse(req.headers.get('Cookie') || '');
  const sessionID = cookie[FC_SESSION_COOKIE];

  if (!sessionID) {
    return Response.json(null);
  }

  const db = env.AppDB;

  const user = await db
    .prepare(
      'SELECT * FROM users WHERE userID = (SELECT userID FROM sessions WHERE sessionID = ?);'
    )
    .bind(sessionID)
    .first<UserModel>();

  return Response.json(user);
}

export async function DeleteSession(req: Request, env: Env) {
  const cookie = parse(req.headers.get('Cookie') || '');
  const sessionID = cookie[FC_SESSION_COOKIE];
  if (!sessionID) {
    return new Response('No session cookie', { status: 401 });
  }

  const db = env.AppDB;

  await db
    .prepare('DELETE FROM sessions WHERE sessionID = ?;')
    .bind(sessionID)
    .run();

  const cookieAtts = [
    `${FC_SESSION_COOKIE}=`,
    `Max-Age=${0}`,
    'Path=/',
    // 'HttpOnly',
    'Secure',
    'SameSite=None',
  ];

  const res = Response.json(null);
  res.headers.set('Set-Cookie', cookieAtts.join('; '));
  return res;
}
