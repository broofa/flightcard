import {
  type RocketModel,
  createRocket,
  isRocketModel,
} from '@flightcard/models';
import { CFQuery } from '../lib/CFQuery';
import type { RouteRequest } from '../lib/CloudflareRouter';
import { querySessionUser } from './routes-session';

async function getRocketModel(req: RouteRequest) {
  const rocketProps = await req.json();
  return isRocketModel(rocketProps) ? rocketProps : null;
}

export async function GetRockets(req: RouteRequest, env: Env) {
  const currentUser = await querySessionUser(req, env);

  if (!currentUser) {
    return Response.json(null, { status: 401 });
  }

  const query = new CFQuery().select('*').from('rockets');
  // .where('userID = ?', currentUser.userID);

  const result = await query.run(env);

  return Response.json(result);
}

export async function GetRocket(req: RouteRequest, env: Env) {
  const { rocketID } = req.params as { rocketID: string };

  const query = new CFQuery()
    .select('*')
    .from('rockets')
    .where('rocketID = ?', rocketID);

  const result = await query.first(env);

  return Response.json(result);
}

export async function PostRockets(req: RouteRequest, env: Env) {
  const currentUser = await querySessionUser(req, env);

  if (!currentUser) {
    return Response.json(null, { status: 401 });
  }

  const rocketProps = await req.json();

  if (!isRocketModel(rocketProps)) {
    return Response.json(null, { status: 400 });
  }

  // CONSTRAINT: User must be current
  if (rocketProps.userID !== currentUser.userID) {
    return Response.json(null, { status: 401 });
  }

  // Pluck props to update
  const values = createRocket({
    extra: rocketProps.extra,
    name: rocketProps.name,
    rocketID: rocketProps.rocketID,
    userID: rocketProps.userID,
  });

  const query = new CFQuery<RocketModel>()
    .insertInto('rockets')
    .values(values)
    .where('rocketID = ?', values.rocketID)
    .and('userID = ?', values.userID)
    .onConflictDo('rocketID', 'UPDATE')
    .set(values);

  const result = await query.run(env);

  return Response.json(result);
}
