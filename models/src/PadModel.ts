import type { BaseModel } from './BaseModel';
import { ModelType } from './ModelType';
import type { Optional } from './utility-types';

export type PadModel = BaseModel & {
  _type?: ModelType.PAD;
  padID: string;
  launchID: string;
  name?: string;
  group?: string;
  extra?: PadExtra;
};

export type PadExtra = {
  isOffline?: boolean;
  rail: string;
  maxImpulse?: number; // Newton-seconds
  minImpulse?: number; // Newton-seconds
};

export function PadModel(v: unknown): v is PadModel {
  return (v as PadModel)?._type === ModelType.PAD;
}

export function createPad(props: Optional<PadModel, '_type'>): PadModel {
  return {
    ...props,
    _type: ModelType.PAD,
  };
}
