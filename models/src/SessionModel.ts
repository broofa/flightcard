import type { BaseModel } from './BaseModel';
import { ModelType } from './ModelType';
import type { Optional } from './utility-types';

export type SessionModel = BaseModel & {
  _type?: ModelType.SESSION;
  expiresAt: number;
  sessionID: string; // PRIMARY KEY
  userID: string;
};

export function isSessionModel(v: unknown): v is SessionModel {
  return (v as SessionModel)?._type === ModelType.SESSION;
}

export function createSession(
  props: Optional<SessionModel, '_type'>
): SessionModel {
  return {
    ...props,
    _type: ModelType.SESSION,
  };
}
