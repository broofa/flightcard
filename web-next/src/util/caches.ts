import {
  ROCKET_PATH,
  SESSION_PATH,
  USER_PATH,
  fetchModel,
} from '@/util/api-util';
import {
  ModelCache,
  type RocketModel,
  type SessionModel,
  type UserModel,
} from '@flightcard/models';

//
// Session
//

export const sessionCache = new ModelCache(async (id: string) =>
  fetchModel<SessionModel>(SESSION_PATH, { sessionID: id })
);

//
// User
//

export const userCache = new ModelCache(async (id: string) =>
  fetchModel<UserModel>(USER_PATH, { userID: id })
);

//
// Rocket
//

export const rocketCache = new ModelCache(async (id: string) =>
  fetchModel<RocketModel>(ROCKET_PATH, { rocketID: id })
);
