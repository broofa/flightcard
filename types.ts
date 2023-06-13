import { tUnitSystemName } from './util/units';

// Tell VSCode not to choke on Parcel's static file imports
declare module '*.png';

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type tRole = 'lco' | 'rso';
export enum CardStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  FLY = 'fly',
  DONE = 'done',
}

export type iPerm = boolean;
export type iPerms = Record<string, iPerm>;
export type Timestamp = number;
export interface iUser {
  id: string;
  name?: string;
  photoURL?: string;
  units?: tUnitSystemName;
}
export type iUsers = Record<string, iUser>;

export interface iLaunch {
  id: string;
  name: string;
  location: string;
  host: string;
  startDate: string;
  endDate: string;
  ridealong?: string;
}
export type iLaunches = Record<string, iLaunch>;

//
// Cert types
//

export enum CertLevel {
  NONE = 0,
  L1 = 1,
  L2 = 2,
  L3 = 3,
}
export enum CertOrg {
  NAR = 'NAR',
  TRA = 'TRA',
}
export interface iCert {
  level: CertLevel;
  firstName: string;
  lastName: string;
  organization: CertOrg;
  memberId: number;
  expires: Timestamp;

  verifiedId?: string; // Id of attendee that verified the ID
  verifiedTime?: Timestamp;
}

export type iCerts = Partial<Record<CertOrg, iCert>>;

// ---
export interface iAttendee extends iUser {
  waiverTime?: Timestamp;
  certs?: iCerts;
  role?: tRole;
}

export type iAttendees = Record<string, iAttendee>;

export type iOfficers = Record<string, boolean>;

export interface iPad {
  id: string;
  name?: string;
  group?: string;
}
export type iPads = Record<string, iPad>;

export interface iMotor {
  id: string;
  name?: string;
  tcMotorId?: string; // thrustcurve.org motorId
  impulse?: number; // newton-secs
  delay?: number;
  stage?: number;
}

export enum Recovery {
  CHUTE = 'chute',
  STREAMER = 'streamer',
  DUAL_DEPLOY = 'dual-deploy',
  TUMBLE = 'tumble',
  GLIDE = 'glide',
  HELICOPTER = 'helicopter',
}

export interface iRocket {
  name?: string;
  manufacturer?: string;
  color?: string;
  recovery?: Recovery;
  diameter?: number; // meters
  length?: number; // meters
  mass?: number; // kg
  _motor?: iMotor;
}

export interface iCard {
  launchId: string;
  userId: string;
  id: string;

  status: CardStatus;

  lcoId?: string;
  rsoId?: string;
  padId?: string;

  firstFlight?: boolean;
  headsUp?: boolean;
  notes?: string;

  rocket?: iRocket;
  motors?: { [motorId: string]: iMotor };
}
export type iCards = Record<string, iCard>;
