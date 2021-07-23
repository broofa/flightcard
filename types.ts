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
  name ?: string;
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
  launchId : string,
  name ?: string;
  group ?: string;
}
export type iPads = Record<string, iPad>;

export interface iMotor {
  name : string;
  tcMotorId ?: string; // thrustcurve.org motorId
  impulse ?: number; // newton-secs
  delay ?: number;
  stage ?: number;
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
  motors ?: iMotor[];
}
export type iCards = Record<string, iCard>;
