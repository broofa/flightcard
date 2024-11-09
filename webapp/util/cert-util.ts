import { iAttendee } from '../types';

export function certString(attendee: iAttendee): string {
  const cert = getCert(attendee);
  if (!cert?.organization) return 'none';
  return `${cert.organization}${cert.level}`;
}

/**
 * Get highest-level [verifed] cert for an attendee
 */
export function getCert(attendee?: iAttendee, isVerified = false) {
  if (!attendee?.certs) return;

  const certs = Object.values(attendee.certs).filter(
    (c) => !isVerified || c.verifiedTime
  );
  return certs.reduce(
    (a, b) => ((a?.level ?? -1) > (b?.level ?? -1) ? a : b),
    certs[0]
  );
}

export function getCertLevel(attendee?: iAttendee, isVerified = false) {
  return getCert(attendee, isVerified)?.level ?? 0;
}

export function getCertVerified(attendee?: iAttendee) {
  return getCert(attendee, true) ? true : false;
}
