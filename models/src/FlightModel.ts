import type { BaseModel } from './BaseModel';
import type { Optional } from './utility-types';

export const MODEL_TYPE_FLIGHT = 'flight';

export type FlightModel = BaseModel & {
  _type?: typeof MODEL_TYPE_FLIGHT;

  extra?: FlightExtra;
  flightID: string;
  launchedByUserID?: string;
  launchID: string;
  name?: string;
  padID?: string;
  rack?: number;
  reviewedByUserID?: string;
  rocketID: string;
  status?: FlightStatus;
  userID: string;
};

// Important: Must keep in sync with flights#status db check
export enum FlightStatus {
  DRAFT = 'draft',
  REVIEW_PENDING = 'review:pending',
  REVIEW_APPROVED = 'review:approved',
  REVIEW_REJECTED = 'review:rejected',
  RACKED = 'racked',
  LAUNCHED_RECYCLE = 'launched:recycle',
  LAUNCHED_INFLIGHT = 'launched:inflight',
  LAUNCHED_CATO = 'launched:cato',
  LAUNCHED_LOST = 'launched:lost',
  LAUNCHED_SUCCESS = 'launched:success',
  LAUNCHED_RECOVERY_FAILURE = 'launched:recovery failure',
  LAUNCHED_IGNITION_FAILURE = 'launched:ignition failure',
  LAUNCHED_SHRED = 'launched:shred',
}

export type FlightExtra = {
  notes?: string;
  isHeadsUp?: boolean;
  isNightFlight?: boolean;
  isFirstFlight?: boolean;
  certFlightLevel?: number;
};

export function FlightModel(v: unknown): v is FlightModel {
  return (v as FlightModel)?._type === MODEL_TYPE_FLIGHT;
}

export function createFlight(
  props: Optional<FlightModel, '_type'>
): FlightModel {
  return {
    ...props,
    _type: MODEL_TYPE_FLIGHT,
  };
}

export function isFlightDone(status: FlightStatus): boolean {
  return [
    FlightStatus.LAUNCHED_CATO,
    FlightStatus.LAUNCHED_LOST,
    FlightStatus.LAUNCHED_SUCCESS,
    FlightStatus.LAUNCHED_RECOVERY_FAILURE,
    FlightStatus.LAUNCHED_IGNITION_FAILURE,
    FlightStatus.LAUNCHED_SHRED,
  ].includes(status);
}
