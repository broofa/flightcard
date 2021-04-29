export type tRole = 'flier' | 'lco' | 'rso';

export interface iPerm {
  admin ?: boolean;
  lco ?: boolean;
  rso ?: boolean;
}
export type iPerms = Record<string, iPerm>;

export interface iUser {
  id : string;
  name : string;
  // email ?: string | undefined;
  currentLaunchId ?: string;
  certLevel ?: number;
  certType ?: string;
  certNumber ?: number;
  certExpires ?: string;
}
export type iUsers = Record<string, iUser>;

export interface iLaunch {
  name : string;
  location : string;
  host : string;
  startDate : string;
  endDate : string;
  rangeOpen : boolean;
}
export type iLaunchs = Record<string, iLaunch>;

export interface iLaunchUser extends iUser {
  waiverSignedDate : string;
  verified : boolean;
  lat ?: number;
  lon ?: number;
}
export type iLaunchUsers = Record<string, iLaunchUser>;

export interface iPad {
  launchId : string;
  name ?: string;
  group ?: string;
}
export type iPads = Record<string, iPad>;

export interface iRocket {
  name : string,
  manufacturer : string,
  color : string,
  diameter : number,
  length : number,
  weight : number,
  motor ?: string,
  _mImpulse ?: number,
  _mBurn ?: number,
  _mThrust ?: number
}

export interface iFlight {
  firstFlight : boolean,
  headsUp : boolean,
  motor : string,
  impulse ?: number,
  notes ?: string
}

export interface iCard {
  launchId : string;
  userId : string;
  lcoId ?: string;
  rsoId ?: string;
  padId ?: string;
  rocket : iRocket;
  flight : iFlight;
  _user ?: iUser, // Cached in Launch.tsx
}
export type iCards = Record<string, iCard>;
