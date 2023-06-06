import { useCurrentAttendee, useOfficers } from './rt_hooks';
import { iAttendee } from '/types';

export function useIsOfficer() {
  const [currentAttendee] = useCurrentAttendee();
  const [officers] = useOfficers();
  return officers?.[currentAttendee?.id ?? ''] ? true : false;
}

export function useRoleAPI() {
  const [officers] = useOfficers();

  return {
    isOfficer(attendee?: iAttendee | string) {
      return !!officers?.[(attendee as iAttendee)?.id ?? attendee];
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
