import { errorResponse } from '@flightcard/common';
import type {
  AttendeeModel,
  BaseModel,
  FlightModel,
  PadModel,
  RocketModel,
  UserModel,
} from '@flightcard/models';
import { CFQuery } from '../lib/CFQuery';
import type { RouteRequest } from '../lib/CloudflareRouter';

export async function GetLaunchRealtime(req: RouteRequest, env: Env) {
  const { launchID } = req.params as { launchID: string };

  const id = env.FC_LAUNCH_DO.idFromName(launchID);
  const stub = env.FC_LAUNCH_DO.get(id);

  try {
    return await stub.fetch(req);
  } catch (err) {
    console.error('Error while handling', req.url, err);
    return errorResponse(err, { status: 500 });
  }
}

export async function GetLaunchState(req: RouteRequest, env: Env) {
  const { launchID } = req.params as { launchID: string };

  const rocketQuery = new CFQuery<RocketModel>()
    .select('rockets.*')
    .from('rockets')
    .join('attendees')
    .using('userID')
    .where('launchID = ?', launchID);
  const flightQuery = new CFQuery<FlightModel>()
    .select('*')
    .from('flights')
    .where('launchID = ?', launchID);
  const attendeeQuery = new CFQuery<AttendeeModel>()
    .select('*')
    .from('attendees')
    .where('launchID = ?', launchID);
  const padQuery = new CFQuery<PadModel>()
    .select('*')
    .from('pads')
    .where('launchID = ?', launchID);
  const userQuery = new CFQuery<UserModel>()
    .select('users.*')
    .from('users')
    .join('attendees')
    .on('users.userID = attendees.userID')
    .where('launchID = ?', launchID);

  const [rockets, flights, attendees, pads, users] = await Promise.all([
    rocketQuery.run(env),
    flightQuery.run(env),
    attendeeQuery.run(env),
    padQuery.run(env),
    userQuery.run(env),
  ]);

  return Response.json({
    rockets: unpackResults(rockets),
    flights: unpackResults(flights),
    attendees: unpackResults(attendees),
    pads: unpackResults(pads),
    users: unpackResults(users),
  });
}

function unpackResults<T extends BaseModel>(d1Result: D1Result<T>) {
  return d1Result.results.map((model) => {
    const result = { ...model };
    if ('extra' in model && typeof model.extra === 'string') {
      model.extra = JSON.parse(model.extra);
    }
    return model;
  });
}
