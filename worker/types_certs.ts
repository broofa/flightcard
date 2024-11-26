// Cert types (copied from types.ts#iCert)

export type Timestamp = number;

enum CertLevel {
  NONE = 0,
  L1 = 1,
  L2 = 2,
  L3 = 3,
}

export enum CertOrg {
  NAR = 'NAR',
  TRA = 'TRA',
}

// TODO: De-dupe this type.  It's defined in webapp/types.ts as well, and should move to @flightcard/common
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
