'use client';
import type React from 'react';
import { cn } from '../../../lib/cn';

export function InputField({
  label,
  value,
  className,
  children,
  ...props
}: { label: string } & React.HTMLProps<HTMLInputElement>) {
  value ??= '';
  return (
    <label
      className={cn(
        className,
        'w-full input input-bordered flex flex-col items-start gap-0'
      )}
    >
      <span className='label-text w-max grow-0'>{label}</span>
      {children}
      <input type='text' value={String(value)} {...props} />
    </label>
  );
}
