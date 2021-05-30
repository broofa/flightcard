import React from 'react';
import { iCert } from '../../types';
import './CertDot.scss';
import { tProps } from './util';

export function CertDot({ cert, showType = false, className, ...props } : {
  cert ?: Partial<iCert>;
  showType ?: boolean;
  disabled ?: boolean;
  className ?: string;
} & tProps) {
  let text = cert?.level ?? '?';
  let cn;

  if (showType && cert?.type) text = cert?.type + ' ' + text;

  if (!cert?.level || cert?.verifiedTime) {
    cn = `cert-dot-${cert?.level ?? 0}`;
  } if (cert?.level && !cert?.verifiedTime) {
    text += '\u26a0';
    cn = 'cert-dot-unverified';
  }

  return <span className={`cert-dot text-uppercase text-nowrap my-auto px-1 ${cn} ${className ?? ''}`}
    {...props}>{text}</span>;
}
