import { errorResponse } from '@flightcard/common';
import type {
  AttendeeModel,
  BaseModel,
  FlightModel,
  MotorModel,
  PadModel,
  RocketModel,
  UserModel,
} from '@flightcard/models';
import { ModelType } from '../../../models/src/ModelType';
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

  const launchQuery = new CFQuery<FlightModel>()
    .select('*')
    .from('launches')
    .where('launchID = ?', launchID);
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
  const motorQuery = new CFQuery<MotorModel>()
    .select('motors.*')
    .from('motors')
    .join('flights')
    .using('flightID')
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
    .using('userID')
    .where('launchID = ?', launchID);

  const [attendees, flights, launches, motors, pads, rockets, users] =
    await Promise.all([
      attendeeQuery.run(env),
      flightQuery.run(env),
      launchQuery.run(env),
      motorQuery.run(env),
      padQuery.run(env),
      rocketQuery.run(env),
      userQuery.run(env),
    ]);

  return Response.json([
    ...dbTidy(attendees, ModelType.ATTENDEE),
    ...dbTidy(flights, ModelType.FLIGHT),
    ...dbTidy(launches, ModelType.LAUNCH),
    ...dbTidy(motors, ModelType.MOTOR),
    ...dbTidy(pads, ModelType.PAD),
    ...dbTidy(rockets, ModelType.ROCKET),
    ...dbTidy(users, ModelType.USER),
  ]);
}

/**
 * Tidy up db model results
 */
function dbTidy<T extends BaseModel>(d1Result: D1Result<T>, type: ModelType) {
  return d1Result.results.map((model) => {
    model._type = type;

    if ('extra' in model && typeof model.extra === 'string') {
      model.extra = JSON.parse(model.extra);
    }

    // Remove nulls
    for (const [k, v] of Object.entries(model)) {
      if (v === null) delete model[k as keyof BaseModel];
    }

    return model;
  });
}
