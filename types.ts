import { tUnitSystemName } from './util/units';

export type DeepPartial<T> = {
  [P in keyof T] ?: DeepPartial<T[P]>;
};

export type tRole = 'lco' | 'rso';
export type tCardStatus = 'review' | 'ready' | 'done';

export type iPerm = boolean;
export type iPerms = Record<string, iPerm>;

export interface iUser {
  id : string;
  name : string;
  photoURL ?: string;
  units ?: tUnitSystemName;
}
export type iUsers = Record<string, iUser>;

export interface iLaunch {
  id : string;
  name : string;
  location : string;
  host : string;
  startDate : string;
  endDate : string;
  rangeOpen : boolean;
  racks ?: iRack[];
}
export type iLaunchs = Record<string, iLaunch>;

export interface iCert {
  level : number;
  type : string;
  number : number;
  expires : string;

  verifiedId : string; // Id of attendee that verified the ID
  verifiedTime : number;
}

export interface iAttendee extends iUser {
  waiverTime : number;
  cert ?: iCert;
  role ?: tRole;
}
export type iAttendees = Record<string, iAttendee>;

export interface iPad {
  id : string,
  name ?: string;
}
export type iPads = Record<string, iPad>;

export interface iRack {
  name ?: string;
  padIds ?: string[];
}

export interface iMotor {
  name ?: string;
  impulse ?: number; // newton-secs
  burn ?: number; // secs
  thrust ?: number // newtons
}

export interface iRocket {
  name ?: string;
  manufacturer ?: string;
  color ?: string;
  diameter ?: number; // meters
  length ?: number; // meters
  mass ?: number; // kg
  _motor ?: iMotor;
}

export interface iCard {
  id : string;

  launchId : string;
  userId : string;
  lcoId ?: string;
  rsoId ?: string;
  padId ?: string;

  status ?: tCardStatus;

  firstFlight ?: boolean;
  headsUp ?: boolean;
  complex ?: boolean;
  notes ?: string;

  rocket ?: iRocket;
  motor ?: iMotor;
}
export type iCards = Record<string, iCard>;
