import React, { createContext, PropsWithChildren, useContext } from 'react';
import { useLaunch } from './LaunchContext';
import { RTState, util } from '/rt';
import { OFFICERS_PATH } from '/rt/rtconstants';
import { iAttendee, iOfficers } from '/types';

const officersContext = createContext<RTState<iOfficers>>([
  undefined,
  true,
  undefined,
]);

export function useOfficers() {
  return useContext(officersContext);
}

export function useRoleAPI() {
  const [officers] = useOfficers();

  return {
    isOfficer(attendee?: iAttendee) {
      return !!officers?.[attendee?.id ?? ''];
    },

    isRSO(attendee?: iAttendee) {
      return !!(officers?.[attendee?.id ?? ''] && attendee?.role === 'rso');
    },

    isLCO(attendee?: iAttendee) {
      return !!(officers?.[attendee?.id ?? ''] && attendee?.role === 'lco');
    },

    getRole(attendee?: iAttendee) {
      return (officers?.[attendee?.id ?? ''] && attendee?.role) || undefined;
    },
  };
}

export function OfficersProvider({ children }: PropsWithChildren) {
  const { Provider } = officersContext;
  const [launch] = useLaunch();

  const rtpath = OFFICERS_PATH.with({ launchId: launch?.id ?? '' });
  const value = util.useValue<iOfficers>(rtpath);

  return <Provider value={value}>{children}</Provider>;
}
