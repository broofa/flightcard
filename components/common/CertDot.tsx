import React, { HTMLAttributes } from 'react';
import './CertDot.scss';
import { Warning } from './Warning';
import { CertLevel, CertOrg, iAttendee } from '/types';
import { getCert, getCertLevel } from '/util/cert-util';
import { cn } from './util';

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

  if (!cert || (cert?.level ?? 0) <= 0) return null;

  let org: CertOrg = cert?.organization;
  let level: CertLevel = cert?.level;

  if (verifiedCert) {
    org = verifiedCert.organization;
    level = verifiedCert.level;
  }

  return (
    <span
      className={cn(
        className,
        'cert-dot text-uppercase text-nowrap my-auto',
        `org-${org}`,
        `level-${level}`
      )}
      {...props}
    >
      <span className='level'>L{level}</span>
      {showType ? <span className='org ps-1'>({org})</span> : null}
      {cert && !verifiedCert && level > 0 ? <Warning className='ps-1' /> : null}
    </span>
  );
}
