import React, { HTMLAttributes } from 'react';
import './CertDot.scss';
import { iAttendee } from '/types';
import { certLevel, getCert } from '/util/cert-util';

export function CertDot({
  attendee,
  showType = false,
  className,
  ...props
}: {
  attendee?: iAttendee;
  showType?: boolean;
  disabled?: boolean;
  className?: string;
} & HTMLAttributes<HTMLSpanElement>) {
  const cert = getCert(attendee);
  let text = String(certLevel(attendee));
  let cn;

  if (showType && cert?.organization) text = cert?.organization + ' ' + text;

  if (!cert?.level || cert?.verifiedTime) {
    cn = `cert-dot-${cert?.level ?? 0}`;
  }
  if (cert?.level && !cert?.verifiedTime) {
    text += '\u26a0';
    cn = 'cert-dot-unverified';
  }

  return (
    <span
      className={`cert-dot text-uppercase text-nowrap my-auto px-1 ${cn} ${
        className ?? ''
      }`}
      {...props}
    >
      {text}
    </span>
  );
}
