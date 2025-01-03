import type { BaseModel } from './BaseModel';
import type { Optional } from './utility-types';

export const MODEL_TYPE_PAD = 'launch';

export type PadModel = BaseModel & {
  _type?: typeof MODEL_TYPE_PAD;
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
  return (v as PadModel)?._type === MODEL_TYPE_PAD;
}

export function createPad(props: Optional<PadModel, '_type'>): PadModel {
  return {
    ...props,
    _type: MODEL_TYPE_PAD,
  };
}
