import type { BaseModel } from './BaseModel';
import type { Optional } from './utility-types';

export const MODEL_TYPE_ATTENDEE = 'attendee';

export type AttendeeModel = BaseModel & {
  _type?: typeof MODEL_TYPE_ATTENDEE;
  attendeeID: string;
  launchID: string;
  userID: string;
  registeredByID?: string;
  isOfficer: boolean;
  tosAcceptedAt?: number;
  extra?: AttendeeExtra;
};

export type AttendeeExtra = {
  activeRole?: AttendeeRole;
};

// REF: https://rocstock.org/range-duty-positions-and-procedures
enum AttendeeRole {
  LD = 'LD', // Launch Director
  RSO = 'RSO', // Range Safety Officer
  LCO = 'LCO', // Launch Control Officer
  FSR = 'FSR', // Flight Safety Reviewer
  PM = 'PM', // Pad Manager
  PH = 'PH', // Pad Helper
  RV = 'RV', // Registration Volunteer
}

export function isAttendeeModel(v: unknown): v is AttendeeModel {
  return (v as AttendeeModel)?._type === MODEL_TYPE_ATTENDEE;
}

export function createAttendee(
  props: Optional<AttendeeModel, '_type'>
): AttendeeModel {
  return {
    ...props,
    _type: MODEL_TYPE_ATTENDEE,
  };
}
