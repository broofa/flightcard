import type { BaseModel } from './BaseModel';
import type { Optional } from './utility-types';

export const MODEL_TYPE_MOTOR = 'motor';

export type MotorModel = BaseModel & {
  _type?: typeof MODEL_TYPE_MOTOR;
  extra?: MotorExtra;
  flightID: string;
  motorID: string;
  designation?: string;
};

export type MotorExtra = {
  tcMotorID?: string;
  impulse?: number; // Ns
  stage?: number; // 1, 2, 3, etc.
  delay?: number; // seconds
};

export function MotorModel(v: unknown): v is MotorModel {
  return (v as MotorModel)?._type === MODEL_TYPE_MOTOR;
}

export function createMotor(props: Optional<MotorModel, '_type'>): MotorModel {
  return {
    ...props,
    _type: MODEL_TYPE_MOTOR,
  };
}
