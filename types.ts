export type tRole = 'flier' | 'lco' | 'rso';

export interface iUser {
  id : string,
  name : string;
  // email ?: string | undefined;
  currentLaunchId ?: string;
  certLevel ?: number;
  certType ?: string;
  certNumber ?: number;
  certExpires ?: string;
}

export interface iLaunch {
  name : string;
  location : string;
  host : string;
  startDate : string;
  endDate : string;
  rangeOpen : boolean;
}

export interface iLaunchUser extends iUser {
  lat ?: number;
  lon ?: number;
  waiverSignedDate : string;
  verified : boolean;
  permissions ?: tRole[];
  role ?: tRole | undefined;
}

export interface iPad {
  launchId : string;
  name ?: string;
  group ?: string;
}

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
