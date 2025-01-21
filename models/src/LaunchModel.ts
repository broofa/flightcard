import type { BaseModel, GPSLocation } from './BaseModel';
import { ModelType } from './ModelType';
import type { Optional } from './utility-types';

export type LaunchModel = BaseModel & {
  _type?: ModelType.LAUNCH;
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

export function isLaunchModel(v: unknown): v is LaunchModel {
  return (v as LaunchModel)?._type === ModelType.LAUNCH;
}

export function createLaunch(
  props: Optional<LaunchModel, '_type'>
): LaunchModel {
  return {
    ...props,
    _type: ModelType.LAUNCH,
  };
}
