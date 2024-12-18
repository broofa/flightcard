import { type RocketProps, isRocketProps } from '@flightcard/db';
import { CFQuery } from '../lib/CFQuery';
import { querySessionUser } from './routes-session';

async function getRocketProps(req: Request) {
  const rocketProps = await req.json();
  return isRocketProps(rocketProps) ? rocketProps : null;
}

export async function GetRockets(req: Request, env: Env) {
  const currentUser = await querySessionUser(req, env);

  if (!currentUser) {
    return Response.json(null, { status: 401 });
  }

  const query = new CFQuery()
    .select('*')
    .from('rockets')
    .where('userID = ?', currentUser.userID);

  const result = await query.run(env);

  return Response.json(result);
}

export async function PostRockets(req: Request, env: Env) {
  const currentUser = await querySessionUser(req, env);

  if (!currentUser) {
    return Response.json(null, { status: 401 });
  }

  const rocketProps = await req.json();

  if (!isRocketProps(rocketProps)) {
    return Response.json(null, { status: 400 });
  }

  // CONSTRAINT: User must be current
  if (rocketProps.userID !== currentUser.userID) {
    return Response.json(null, { status: 401 });
  }

  // Pluck props to update
  const values: RocketProps = {
    color: rocketProps.color,
    diameter: rocketProps.diameter,
    length: rocketProps.length,
    manufacturer: rocketProps.manufacturer,
    mass: rocketProps.mass,
    name: rocketProps.name,
    recovery: rocketProps.recovery,
    rocketID: rocketProps.rocketID,
    userID: rocketProps.userID,
  };

  const query = new CFQuery()
    .insertInto('rockets')
    .values(values)
    .where('rocketID = ?', values.rocketID)
    .and('userID = ?', values.userID)
    .onConflictDo('rocketID', 'UPDATE')
    .set(values);

  const result = await query.run(env);

  return Response.json(result);
}
