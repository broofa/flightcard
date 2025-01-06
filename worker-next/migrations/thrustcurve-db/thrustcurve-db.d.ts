type TCSample = [
  number, // time (seconds)
  number // thrust (Newtons)
];

export declare type TCMotor = {
  availability: 'regular' | 'OOP';
  avgThrustN: number;
  burnTimeS: number;
  certOrg: string;
  commonName: string;
  dataFiles: number;
  delays: string;
  designation: string;
  diameter: number;
  impulseClass:
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G'
    | 'H'
    | 'I'
    | 'J'
    | 'K'
    | 'L'
    | 'M'
    | 'N'
    | 'O';
  infoUrl: string;
  length: number;
  manufacturer: string;
  manufacturerAbbrev: string;
  maxThrustN: number;
  motorId: string;
  propInfo: string;
  propWeightG: number;
  samples?: TCSample[];
  sparky?: boolean;
  totImpulseNs: number;
  totalWeightG: number;
  type: 'SU' | 'hybrid' | 'reload';
  updatedOn: string;
};

declare const MOTORS: TCMotor[];
export default MOTORS;
