import { useContext } from 'react';
import { useAuthUser } from './AuthIdContext';
import { launchStateContext } from './LaunchStateContext';
import { RTState, useRTValue } from '/rt';
import { ATTENDEE_PATH, LAUNCHES_PATH, USER_PATH } from '/rt/rtconstants';
import { iAttendee, iLaunches, iUser } from '/types';
import { MKS, tUnitSystem, USCS } from '/util/units';

export function useCurrentAttendee() {
  const [currentUser] = useCurrentUser();
  const [launch] = useLaunch();

  return useRTValue<iAttendee>(
    ATTENDEE_PATH.with({
      launchId: launch?.id ?? '',
      userId: currentUser?.id ?? '',
    })
  );
}

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

export function useOfficers() {
  return useContext(launchStateContext).officers;
}

export function useCards() {
  return useContext(launchStateContext).cards;
}

export function usePads() {
  return useContext(launchStateContext).pads;
}

export function useUserUnits(): RTState<tUnitSystem> {
  const [currentUser, loading, err] = useCurrentUser();
  return [currentUser?.units == 'uscs' ? USCS : MKS, loading, err];
}
