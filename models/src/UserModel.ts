import type { BaseModel } from './BaseModel';
import type { Optional } from './utility-types';

export const MODEL_TYPE_USER = 'user';

export type UserModel = BaseModel & {
  _type?: typeof MODEL_TYPE_USER;
  avatarURL?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  narID?: number;
  traID?: number;
  units: UserUnits;
  userID: string; // PRIMARY KEY
};

export enum UserUnits {
  SI = 'si',
  US = 'us',
}

export function isUserModel(v: unknown): v is UserModel {
  return (v as UserModel)?._type === MODEL_TYPE_USER;
}

export function createUser(props: Optional<UserModel, '_type'>): UserModel {
  return {
    ...props,
    _type: MODEL_TYPE_USER,
  };
}
