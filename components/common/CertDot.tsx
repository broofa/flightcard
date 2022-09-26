import React, { HTMLAttributes } from 'react';
import './CertDot.scss';
import { Warning } from './Warning';
import { iAttendee } from '/types';
import { getCert, getCertLevel } from '/util/cert-util';

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
  const verifiedCert = getCert(attendee, true);

  let text = String(getCertLevel(attendee));
  let cn;

  if (!verifiedCert) {
    if (cert) {
      return <Warning />;
      // text = '\u26a0';
      // cn = 'cert-dot-unverified';
    } else {
      return null;
    }
  } else {
    text = `L${verifiedCert.level}`;
    cn = `cert-dot-${verifiedCert.level}`;

    if (showType) {
      text = `${cert?.organization} ${text}`;
    }
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
