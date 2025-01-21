import type { BaseModel } from './BaseModel';
import { ModelType } from './ModelType';
import type { Optional } from './utility-types';

export type CertModel = BaseModel & {
  _type?: ModelType.CERT;
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
  return (v as CertModel)?._type === ModelType.CERT;
}

export function createCert(props: Optional<CertModel, '_type'>): CertModel {
  return {
    ...props,
    _type: ModelType.CERT,
  };
}
