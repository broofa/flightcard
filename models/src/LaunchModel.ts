import type { BaseModel, GPSLocation } from './BaseModel';
import type { Optional } from './utility-types';

export const MODEL_TYPE_LAUNCH = 'launch';

export type LaunchModel = BaseModel & {
  _type?: typeof MODEL_TYPE_LAUNCH;
  name?: string;
  launchID: string;

  endTime?: number;
  club?: string;
  startTime?: number;
  extra?: LaunchExtra;
};

export type LaunchExtra = {
  noSparkies?: boolean;
  onWindHold?: boolean;
  waiverAltitude?: number; // meters, AGL
  maxMotorImpulse?: number; // Newton-seconds
  siteLocation?: GPSLocation;
  description?: string;
  siteName?: string;
};

export function LaunchModel(v: unknown): v is LaunchModel {
  return (v as LaunchModel)?._type === MODEL_TYPE_LAUNCH;
}

export function createLaunch(
  props: Optional<LaunchModel, '_type'>
): LaunchModel {
  return {
    ...props,
    _type: MODEL_TYPE_LAUNCH,
  };
}
