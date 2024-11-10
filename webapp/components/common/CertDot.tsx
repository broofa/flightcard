import React, { type HTMLAttributes } from 'react';
import { getCert } from '/util/cert-util';
import type { CertLevel, CertOrg, iAttendee } from '../../types';
import { Warning } from './Warning';
import { cn } from './util';

import styles from './CertDot.module.scss';

export function CertDot({
  attendee,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        styles.root,
        className,
        'certDot text-uppercase text-nowrap my-auto',
        `org-${org}`
      )}
      {...props}
    >
      <span className={cn(styles[`l${level}`])}>L{level}</span>
      <span className={cn('ps-1', styles[`org${org}`])}>({org})</span>
      {cert && !verifiedCert && level > 0 ? <Warning className='ps-1' /> : null}
    </span>
  );
}
