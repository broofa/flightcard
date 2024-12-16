import { BaseModel, type BaseProps } from './BaseModel';

export enum Recovery {
  CHUTE = 'chute',
  STREAMER = 'streamer',
  DUAL_DEPLOY = 'dual-deploy',
  TUMBLE = 'tumble',
  GLIDE = 'glide',
  HELICOPTER = 'helicopter',
}

export type RocketProps = BaseProps & {
  rocketID: string;

  name?: string;
  manufacturer?: string;
  color?: string;
  recovery?: Recovery;
  diameter?: number; // meters
  length?: number; // meters
  mass?: number; // kg
  // _motor?: iMotor;
};

export function isRocketProps(v: unknown): v is RocketProps {
  return typeof v === 'object' && v !== null && 'rocketID' in v;
}

export class RocketModel extends BaseModel<RocketProps> {
  get rocketID() {
    return this.get('rocketID');
  }
  set rocketID(value: string) {
    this.mutable.set('rocketID', value);
  }

  get name() {
    return this.get('name');
  }
  set name(value: string | undefined) {
    this.mutable.set('name', value);
  }

  get manufacturer() {
    return this.get('manufacturer');
  }
  set manufacturer(value: string | undefined) {
    this.mutable.set('manufacturer', value);
  }

  get color() {
    return this.get('color');
  }
  set color(value: string | undefined) {
    this.mutable.set('color', value);
  }

  get recovery() {
    return this.get('recovery');
  }
  set recovery(value: Recovery | undefined) {
    this.mutable.set('recovery', value);
  }

  get diameter() {
    return this.get('diameter');
  }
  set diameter(value: number | undefined) {
    this.mutable.set('diameter', value);
  }

  get length() {
    return this.get('length');
  }
  set length(value: number | undefined) {
    this.mutable.set('length', value);
  }

  get mass() {
    return this.get('mass');
  }
  set mass(value: number | undefined) {
    this.mutable.set('mass', value);
  }
}
