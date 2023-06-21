import { useContext } from 'react';
import { useAuthUser } from './AuthIdContext';
import { launchStateContext } from './LaunchStateContext';
import { RTState, useRTValue } from '/rt';
import { LAUNCHES_PATH, USER_PATH } from '/rt/rtconstants';
import { iAttendee, iCard, iLaunches, iUser } from '/types';
import { MKS, USCS, tUnitSystem } from '/util/units';

export function useCurrentUser() {
  const [authUser, authLoading, authError] = useAuthUser();
  const authFields = authUser ? { authId: authUser.uid } : undefined;
  const rtpath = USER_PATH.with(authFields);
  const userState = useRTValue<iUser>(rtpath);

  if (authLoading) {
    return [undefined, true, undefined] as RTState<iUser>;
  } else if (authError) {
    return [undefined, false, authError] as RTState<iUser>;
  }

  if (!userState) {
    console.error('User authed, but no user found');
  }

  return userState;
}

export function useLaunches(): RTState<iLaunches> {
  return useRTValue<iLaunches>(LAUNCHES_PATH);
}

export function useLaunch() {
  return useContext(launchStateContext).launch;
}

export function useAttendees() {
  return useContext(launchStateContext).attendees;
}

export function useCurrentAttendee() {
  const userState = useCurrentUser();
  return useAttendee(userState[0]?.id ?? '');
}

export function useAttendee(attendeeId: string) {
  const [attendees, loading, error] = useContext(launchStateContext).attendees;
  return [attendees?.[attendeeId], loading, error] as RTState<iAttendee>;
}

export function useOfficers() {
  return useContext(launchStateContext).officers;
}

export function useCards() {
  return useContext(launchStateContext).cards;
}

export function useCard(cardId: string) {
  const [cards, loading, error] = useContext(launchStateContext).cards;
  return [cards?.[cardId], loading, error] as RTState<iCard>;
}

export function usePads() {
  return useContext(launchStateContext).pads;
}

export function useUserUnits(): RTState<tUnitSystem> {
  const [currentUser, loading, err] = useCurrentUser();
  return [currentUser?.units == 'uscs' ? USCS : MKS, loading, err];
}
