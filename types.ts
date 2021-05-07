export type DeepPartial<T> = {
  [P in keyof T] ?: DeepPartial<T[P]>;
};

export type tRole = 'lco' | 'rso';

export type iPerm = boolean;
export type iPerms = Record<string, iPerm>;

export interface iUser {
  id : string;
  name : string;
  photoURL ?: string;
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

  verifiedId : string; // Id of Attendee that verified the ID
  verifiedDate : string;
}

export interface iAttendee extends iUser {
  waiverSignedDate : string;
  cert ?: iCert;
  role ?: tRole;
}
export type iAttendees = Record<string, iAttendee>;

export interface iPad {
  launchId : string;
  name ?: string;
  group ?: string;
}
export type iPads = Record<string, iPad>;

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
  weight ?: number; // kg
  _motor ?: iMotor;
}

export interface iCard {
  id : string;

  launchId : string;
  userId : string;
  lcoId ?: string;
  rsoId ?: string;
  padId ?: string;

  firstFlight ?: boolean;
  headsUp ?: boolean;
  complex ?: boolean;
  notes ?: string;

  rocket ?: iRocket;
  motor ?: iMotor;
}
export type iCards = Record<string, iCard>;
