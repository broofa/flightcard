'use client';
import type React from 'react';
import { cn } from '../../../lib/cn';

export function RadioField({
  value,
  values,
  className,
  ...props
}: { values: Record<string, string> } & React.HTMLProps<HTMLInputElement>) {
  return (
    <div className='flex flex-wrap gap-4'>
      {Object.entries(values).map(([optionTitle, optionValue]) => (
        <label
          key={optionValue}
          className={cn('label cursor-pointer flex gap-2', className)}
        >
          <span className='label-text w-max grow text-right'>{optionTitle}</span>
          <input
            type='radio'
            className='radio'
            {...props}
            value={optionValue}
            checked={optionValue === value}
          />
        </label>
      ))}
    </div>
  );
}
