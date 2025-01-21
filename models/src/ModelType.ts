import type { AttendeeModel } from './AttendeeModel';
import type { BaseModel } from './BaseModel';
import type { CertModel } from './CertModel';
import type { FlightModel } from './FlightModel';
import type { LaunchModel } from './LaunchModel';
import type { MotorModel } from './MotorModel';
import type { PadModel } from './PadModel';
import type { RocketModel } from './RocketModel';
import type { SessionModel } from './SessionModel';
import type { UserModel } from './UserModel';

export enum ModelType {
  ATTENDEE = 'attentdee',
  CERT = 'cert',
  FLIGHT = 'flight',
  LAUNCH = 'launch',
  MOTOR = 'motor',
  PAD = 'pad',
  ROCKET = 'rocket',
  SESSION = 'session',
  USER = 'user',
}

// Old as Partial because it should have the primary identifier, if nothing else
type ModelEventUpdate<T extends BaseModel> =
  | { new: T; old?: Partial<T> | null }
  | { new?: T | null; old: Partial<T> };

type ModelEventPatch<T extends BaseModel> = { patch: Partial<T> };
type ModelEvent<T extends BaseModel> = ModelEventUpdate<T> | ModelEventPatch<T>;

export function isModelEventUpdate<T extends BaseModel>(
  v: ModelEvent<T>
): v is ModelEventUpdate<T> {
  return 'new' in v || 'old' in v;
}
export function isModelEventPatch<T extends BaseModel>(
  v: ModelEvent<T>
): v is ModelEventPatch<T> {
  return 'patch' in v;
}

export type ModelStore = {
  [ModelType.ATTENDEE]: Map<string, AttendeeModel>;
  [ModelType.CERT]: Map<string, CertModel>;
  [ModelType.FLIGHT]: Map<string, FlightModel>;
  [ModelType.LAUNCH]: Map<string, LaunchModel>;
  [ModelType.MOTOR]: Map<string, MotorModel>;
  [ModelType.PAD]: Map<string, PadModel>;
  [ModelType.ROCKET]: Map<string, RocketModel>;
  [ModelType.SESSION]: Map<string, SessionModel>;
  [ModelType.USER]: Map<string, UserModel>;
};

export type ModelStoreUpdate = {
  [ModelType.ATTENDEE]?: ModelEvent<AttendeeModel>[];
  [ModelType.CERT]?: ModelEvent<CertModel>[];
  [ModelType.FLIGHT]?: ModelEvent<FlightModel>[];
  [ModelType.LAUNCH]?: ModelEvent<LaunchModel>[];
  [ModelType.MOTOR]?: ModelEvent<MotorModel>[];
  [ModelType.PAD]?: ModelEvent<PadModel>[];
  [ModelType.ROCKET]?: ModelEvent<RocketModel>[];
  [ModelType.SESSION]?: ModelEvent<SessionModel>[];
  [ModelType.USER]?: ModelEvent<UserModel>[];
};
