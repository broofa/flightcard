import type { BaseModel } from './BaseModel';
import type { Optional } from './utility-types';

export const MODEL_TYPE_SESSION = 'session';

export type SessionModel = BaseModel & {
  _type?: typeof MODEL_TYPE_SESSION;
  expiresAt: number;
  sessionID: string; // PRIMARY KEY
  userID: string;
};

export function isSessionModel(v: unknown): v is SessionModel {
  return (v as SessionModel)?._type === MODEL_TYPE_SESSION;
}

export function createSession(
  props: Optional<SessionModel, '_type'>
): SessionModel {
  return {
    ...props,
    _type: MODEL_TYPE_SESSION,
  };
}
