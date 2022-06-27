import { RTPath } from './RTPath';

export type UserField = { userId: string };
export type LaunchField = { launchId: string };
export type CardField = { cardId: string };
export type MotorField = { motorId: string };
export type AuthField = { authId: string };
export type PadField = { padId: string };
export type CardFields = LaunchField & CardField;
export type MotorFields = CardFields & MotorField;
export type AttendeeFields = LaunchField & UserField;

export const USER_PATH = new RTPath<AuthField>('/users/:authId');
export const USER_UNITS = USER_PATH.append('units');

export const ATTENDEES_INDEX_PATH = new RTPath('/attendees');
export const ATTENDEES_PATH =
  ATTENDEES_INDEX_PATH.append<LaunchField>(':launchId');
export const ATTENDEE_PATH = ATTENDEES_PATH.append<AttendeeFields>(':userId');
export const ATTENDEE_CERT_PATH = ATTENDEE_PATH.append('cert');
export const ATTENDEE_ROLE_PATH = ATTENDEE_PATH.append('role');

export const OFFICERS_PATH = new RTPath<LaunchField>('/officers/:launchId');
export const OFFICER_PATH = OFFICERS_PATH.append<UserField>(':userId');

export const PADS_PATH = new RTPath<LaunchField>('/pads/:launchId');
export const PAD_PATH = PADS_PATH.append<PadField>(':padId');

export const LAUNCHES_PATH = new RTPath('/launches');
export const LAUNCH_PATH = LAUNCHES_PATH.append<LaunchField>(':launchId');

export const CARDS_INDEX_PATH = new RTPath('/cards');
export const CARDS_PATH = CARDS_INDEX_PATH.append<LaunchField>(':launchId');
export const CARD_PATH = CARDS_PATH.append<CardField>(':cardId');
export const CARD_STATUS = CARD_PATH.append('status');
export const CARD_MOTORS_PATH = CARD_PATH.append('motors');
export const CARD_MOTOR_PATH = CARD_MOTORS_PATH.append<MotorField>(':motorId');
export const ROCKET_PATH = CARD_PATH.append('rocket');
export const ROCKET_MASS_PATH = ROCKET_PATH.append('mass');
