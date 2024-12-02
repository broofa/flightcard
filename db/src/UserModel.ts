import { BaseModel, type BaseProps } from './BaseModel';

export type UserProps = BaseProps & {
  userID: string;

  avatarURL?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  narID?: number;
  traID?: number;
  units: string;
};

export function isUserProps(v: unknown): v is UserProps {
  return typeof v === 'object' && v !== null && 'userID' in v;
}

export class UserModel extends BaseModel<UserProps> {
  get userID() {
    return this.get('userID');
  }
  set userID(value: string) {
    this.mutable.set('userID', value);
  }

  get email() {
    return this.get('email');
  }
  set email(value: string) {
    this.mutable.set('email', value);
  }

  get firstName() {
    return this.get('firstName');
  }
  set firstName(value: string | undefined) {
    this.mutable.set('firstName', value);
  }

  get lastName() {
    return this.get('lastName');
  }
  set lastName(value: string | undefined) {
    this.mutable.set('lastName', value);
  }

  get avatarURL() {
    return this.get('avatarURL');
  }
  set avatarURL(value: string | undefined) {
    this.mutable.set('avatarURL', value);
  }

  get narID() {
    return this.get('narID');
  }
  set narID(value: number | undefined) {
    this.mutable.set('narID', value);
  }

  get traID() {
    return this.get('traID');
  }
  set traID(value: number | undefined) {
    this.mutable.set('traID', value);
  }

  get units() {
    return this.get('units');
  }
  set units(value: string) {
    this.mutable.set('units', value);
  }
}
