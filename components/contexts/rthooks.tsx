import { useAuthUser } from './AuthIdContext';
import { useLaunch } from './LaunchContext';
import { RTState, useRTValue } from '/rt';
import {
  ATTENDEES_PATH,
  ATTENDEE_PATH,
  CARDS_PATH,
  LAUNCHES_PATH,
  OFFICERS_PATH,
  PADS_PATH,
  USER_PATH,
} from '/rt/rtconstants';
import {
  iAttendee,
  iAttendees,
  iCards,
  iLaunches,
  iOfficers,
  iPads,
  iUser,
} from '/types';
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

export function useUserUnits(): RTState<tUnitSystem> {
  const [currentUser, loading, err] = useCurrentUser();
  return [currentUser?.units == 'uscs' ? USCS : MKS, loading, err];
}

export function useAttendees(): RTState<iAttendees> {
  const [launch] = useLaunch();

  return useRTValue<iAttendees>(
    ATTENDEES_PATH.with({ launchId: launch?.id ?? '' })
  );
}

export function useOfficers(): RTState<iOfficers> {
  const [launch] = useLaunch();

  return useRTValue<iOfficers>(
    OFFICERS_PATH.with({ launchId: launch?.id ?? '' })
  );
}

export function useCards(): RTState<iCards> {
  const [launch] = useLaunch();

  return useRTValue<iCards>(CARDS_PATH.with({ launchId: launch?.id ?? '' }));
}

export function usePads(): RTState<iPads> {
  const [launch] = useLaunch();

  return useRTValue<iPads>(PADS_PATH.with({ launchId: launch?.id ?? '' }));
}
