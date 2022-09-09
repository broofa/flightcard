import { RTPath } from './RTPath';

export type UserIdField = { userId: string };
export type LaunchIdField = { launchId: string };
export type CardIdField = { cardId: string };
export type MotorIdField = { motorId: string };
export type AuthIdField = { authId: string };
export type PadIdField = { padId: string };
export type CardFields = LaunchIdField & CardIdField;
export type MotorFields = CardFields & MotorIdField;
export type AttendeeFields = LaunchIdField & UserIdField;

export const USER_PATH = new RTPath<AuthIdField>('/users/:authId');
export const USER_UNITS = USER_PATH.append('units');

export const ATTENDEES_INDEX_PATH = new RTPath('/attendees');
export const ATTENDEES_PATH =
  ATTENDEES_INDEX_PATH.append<LaunchIdField>(':launchId');
export const ATTENDEE_PATH = ATTENDEES_PATH.append<AttendeeFields>(':userId');
export const ATTENDEE_CERTS_PATH = ATTENDEE_PATH.append('certs');
export const ATTENDEE_TRA_CERT_PATH = ATTENDEE_PATH.append('certs/TRA');
export const ATTENDEE_NAR_CERT_PATH = ATTENDEE_PATH.append('certs/NAR');
export const ATTENDEE_ROLE_PATH = ATTENDEE_PATH.append('role');

export const OFFICERS_PATH = new RTPath<LaunchIdField>('/officers/:launchId');
export const OFFICER_PATH = OFFICERS_PATH.append<UserIdField>(':userId');

export const PADS_INDEX_PATH = new RTPath('/pads');
export const PADS_PATH = PADS_INDEX_PATH.append<LaunchIdField>('/:launchId');
export const PAD_PATH = PADS_PATH.append<PadIdField>(':padId');

export const LAUNCHES_PATH = new RTPath('/launches');
export const LAUNCH_PATH = LAUNCHES_PATH.append<LaunchIdField>(':launchId');

export const CARDS_INDEX_PATH = new RTPath('/cards');
export const CARDS_PATH = CARDS_INDEX_PATH.append<LaunchIdField>(':launchId');
export const CARD_PATH = CARDS_PATH.append<CardIdField>(':cardId');
export const CARD_STATUS = CARD_PATH.append('status');
export const CARD_MOTORS_PATH = CARD_PATH.append('motors');
export const CARD_MOTOR_PATH = CARD_MOTORS_PATH.append<MotorIdField>(':motorId');
export const ROCKET_PATH = CARD_PATH.append('rocket');
export const ROCKET_MASS_PATH = ROCKET_PATH.append('mass');
