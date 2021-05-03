import React, { useState } from 'react';
import { iCert } from '../types';
import './css/CertDot.scss';
import { tProps } from './util';

export function CertDot({ cert, expand: _expand = false, className, ...props } : {
  cert ?: Partial<iCert>;
  expand ?: boolean;
  disabled ?: boolean;
  className ?: string;
} & tProps) {
  const [expand, setExpand] = useState(_expand);

  let text = cert?.level ?? '?';
  let cn;

  if (expand && cert?.type) text = cert?.type + ' ' + text;

  if (!cert?.level || cert?.verifiedDate) {
    cn = `cert-dot-${cert?.level ?? 0}`;
  } if (cert?.level && !cert?.verifiedDate) {
    text += '\u26a0';
    cn = 'cert-dot-unverified';
  }

  function onClick(e) {
    // Assume elements set to expand should not be closed (saves having a
    // separate property for this)
    if (_expand) return;

    e.stopPropagation();
    setExpand(!expand);
  }

  return <span className={`cert-dot ${cn} ${className ?? ''}`}
    onClick={onClick} {...props}>{text}</span>;
}
