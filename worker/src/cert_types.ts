export interface Env {
  CertsKV: KVNamespace;
  CertsDB: D1Database;

  NAR_API_KEY: string;
  NAR_API_ORG: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_KV_NAMESPACE: string;
}
// Cert types (copy from types.ts#iCert)

export type Timestamp = number;
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

export type CertGroup = Record<string, iCert>;
