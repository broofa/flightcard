import { FC_SESSION_COOKIE } from '@flightcard/common';
import type { UserModel } from '@flightcard/db';
import cookie from 'cookie';
import { CFQuery } from '../lib/CFQuery';

export function getSessionID(req: Request) {
  const cookies = cookie.parse(req.headers.get('Cookie') || '');
  return cookies[FC_SESSION_COOKIE];
}

export async function querySessionUser(req: Request, env: Env) {
  const sessionID = getSessionID(req);

  if (!sessionID) {
    return null;
  }

  const query = new CFQuery();
  query
    .select('*')
    .from('users')
    .where(
      'userID',
      query
        .subquery()
        .select('userID')
        .from('sessions')
        .where('sessionID', sessionID)
    );

  return await query.first<UserModel>(env);
}

export async function GetSessionUser(req: Request, env: Env) {
  const user = await querySessionUser(req, env);

  return Response.json(user);
}

export async function DeleteSession(req: Request, env: Env) {
  const res = Response.json(null);

  const sessionID = getSessionID(req);
  if (!sessionID) {
    // No cookie = nothing to do
    return res;
  }

  await new CFQuery().delete('sessions').where('sessionID', sessionID).run(env);

  res.headers.set(
    'Set-Cookie',
    cookie.serialize(FC_SESSION_COOKIE, '', {
      maxAge: 0,
      path: '/',
      secure: true,
      sameSite: 'none',
    })
  );
  return res;
}
