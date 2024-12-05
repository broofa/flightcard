'use client';
import type React from 'react';

export function RadioField({
  value,
  values,
  ...props
}: { values: Record<string, string> } & React.HTMLProps<HTMLInputElement>) {
  return (
    <div className='flex gap-4 w-full'>
      {Object.entries(values).map(([optionTitle, optionValue]) => (
        <label key={optionValue} className='label cursor-pointer flex gap-2'>
          <span className='label-text w-max'>{optionTitle}</span>
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
