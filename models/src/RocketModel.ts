import type { BaseModel } from './BaseModel';
import { ModelType } from './ModelType';
import type { Optional } from './utility-types';

// Subset of CSS named colors that are detected in rocket descriptions
export const ROCKET_COLORS = [
  'aqua',
  'beige',
  'black',
  'blue',
  'brown',
  'crimson',
  'cyan',
  'gold',
  'gray',
  'grey',
  'green',
  'grey',
  'indigo',
  'lavender',
  'lime',
  'linen',
  'magenta',
  'maroon',
  'olive',
  'orange',
  'pink',
  'purple',
  'red',
  'silver',
  'tan',
  'teal',
  'turquoise',
  'violet',
  'white',
  'yellow',
];

export type RocketModel = BaseModel & {
  _type?: ModelType.ROCKET;
  name?: string;
  extra?: RocketExtra;
  rocketID: string;
  userID: string;
};

export type RocketExtra = {
  description?: string;
  diameter?: number; // meters
  length?: number; // meters
  manufacturer?: string;
  mass?: number; // kg
  notes?: string;
  recovery?: Recovery;
};

export enum Recovery {
  CHUTE = 'chute',
  STREAMER = 'streamer',
  DUAL_DEPLOY = 'dual-deploy',
  TUMBLE = 'tumble',
  GLIDE = 'glide',
  HELICOPTER = 'helicopter',
}

export function isRocketModel(v: unknown): v is RocketModel {
  return (v as RocketModel)?._type === ModelType.ROCKET;
}

export function createRocket(
  props: Optional<RocketModel, '_type'>
): RocketModel {
  return {
    ...props,
    _type: ModelType.ROCKET,
  };
}
