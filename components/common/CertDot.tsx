import React, { HTMLAttributes } from 'react';
import './CertDot.scss';
import { iCert } from '/types';

export function CertDot({
  cert,
  showType = false,
  className,
  ...props
}: {
  cert?: Partial<iCert>;
  showType?: boolean;
  disabled?: boolean;
  className?: string;
} & HTMLAttributes<HTMLSpanElement>) {
  let text = cert?.level ?? '?';
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
