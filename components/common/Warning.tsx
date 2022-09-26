import React, { HTMLAttributes } from 'react';
import { cn } from './util';
import './Warning.scss';

export function Warning({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(className, `warning`)} {...props}>
      {'\u26a0'} {children}
    </span>
  );
}
