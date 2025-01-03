import type { BaseModel } from './BaseModel';
import type { Optional } from './utility-types';

export const MODEL_TYPE_CERT = 'cert';

export type CertModel = BaseModel & {
  _type?: typeof MODEL_TYPE_CERT;
  certID: string;
  expiresAt: number;
  firstName: string;
  lastName: string;
  level: CertLevel;
  memberId: number;
  organization: CertOrg;
};

export enum CertOrg {
  NAR = 'NAR',
  TRA = 'TRA',
}

export enum CertLevel {
  NONE = 0,
  L1 = 1,
  L2 = 2,
  L3 = 3,
}

export function isCertModel(v: unknown): v is CertModel {
  return (v as CertModel)?._type === MODEL_TYPE_CERT;
}

export function createCert(props: Optional<CertModel, '_type'>): CertModel {
  return {
    ...props,
    _type: MODEL_TYPE_CERT,
  };
}
