import { BaseModel, type BaseProps } from './BaseModel';

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

export type CertProps = BaseProps & {
  level: CertLevel;
  firstName: string;
  lastName: string;
  organization: CertOrg;
  memberId: number;
  expires: number;
};

export class CertModel extends BaseModel<CertProps> {}
