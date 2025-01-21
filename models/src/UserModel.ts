import type { BaseModel } from './BaseModel';
import { ModelType } from './ModelType';
import type { Optional } from './utility-types';

export type UserModel = BaseModel & {
  _type?: ModelType.USER;
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
  return (v as UserModel)?._type === ModelType.USER;
}

export function createUser(props: Optional<UserModel, '_type'>): UserModel {
  return {
    ...props,
    _type: ModelType.USER,
  };
}
