'use client';
import type React from 'react';

export function InputField({
  label,
  value,
  ...props
}: { label: string } & React.HTMLProps<HTMLInputElement>) {
  value ??= '';
  return (
    <label className='w-full input input-bordered flex flex-col items-start gap-0'>
      <span className='label-text w-20 grow-0'>{label}</span>
      {/* TODO: remove readOnly */}
      <input type='text' value={String(value)} {...props} />
    </label>
  );
}
