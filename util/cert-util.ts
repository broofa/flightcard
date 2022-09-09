import { iAttendee, iCert } from '/types';

export function certString(cert?: iCert) {
  if (!cert?.organization) return 'none';
  return `${cert.organization}${cert.level}`;
}

/**
 * Get highest-level [verifed] cert for an attendee
 */
export function getCert(attendee?: iAttendee, isVerified = false) {
  if (!attendee?.certs) return;

  return Object.values(attendee.certs)
    ?.filter(c => !isVerified || c.verifiedTime)
    .reduce((a, b) => ((a?.level ?? -1) > (b?.level ?? -1) ? a : b));
}

export function certLevel(attendee?: iAttendee, isVerified = false) {
  return getCert(attendee, isVerified)?.level ?? 0;
}
