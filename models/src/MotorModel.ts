import type { BaseModel } from './BaseModel';
import { ModelType } from './ModelType';
import type { Optional } from './utility-types';

export type MotorModel = BaseModel & {
  _type?: ModelType.MOTOR;
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
  return (v as MotorModel)?._type === ModelType.MOTOR;
}

export function createMotor(props: Optional<MotorModel, '_type'>): MotorModel {
  return {
    ...props,
    _type: ModelType.MOTOR,
  };
}
