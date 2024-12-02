'use client';

import { Loading } from '@/app/profile/Loading';
import { useCurrentUser } from '@/app/useCurrentUser';
import type { UserProps } from '@flightcard/db';
import type React from 'react';
import { type ChangeEvent, useState } from 'react';

type UserFormProps = UserProps & { name?: string };

export default function ProfilePage() {
  const [currentUser] = useCurrentUser();
  const [fields, setFields] = useState<UserFormProps>();

  if (!currentUser) return <Loading wat='User' />;

  if (!fields) {
    setFields(currentUser.props());
    return <Loading wat='Fields' />;
  }

  const changed = !objectDiff(fields, currentUser.props());
  const defaultName = [fields.firstName, fields.lastName]
    .filter(Boolean)
    .join(' ');

  const doCancel = () => {
    setFields(undefined);
  };

  const doSave = () => {
    const payload = { ...fields };
    // Parse UI-only fields
    const nameParts = payload.name?.split(/\s+/) || [];
    payload.firstName = nameParts.shift()?.trim() || undefined;
    payload.lastName = nameParts.join(' ').trim() || undefined;
    delete payload.name;

    // TODO: HANDLE ERRORS!
    fetch('/worker/users/current', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const updateField = (
    key: keyof UserFormProps,
    value: UserFormProps[typeof key]
  ) => {
    setFields({ ...fields, [key]: value });
  };

  return (
    <div
      className='grid items-center justify-items-center p-8 gap-4 font-[family-name:var(--font-geist-sans)] max-w-sm mx-auto'
      suppressHydrationWarning
    >
      <InputField
        label='Email'
        disabled
        value={fields.email}
        onChange={() => {}}
      />

      <InputField
        label='Name'
        value={fields.name ?? defaultName}
        placeholder='e.g. Tyler Ramsey'
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateField('name', e.target.value)
        }
      />

      <h2>Memberships</h2>

      <InputField
        label='Tripoli #'
        value={fields.traID}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateField('traID', e.target.value)
        }
      />
      <InputField
        label='NAR #'
        value={fields.narID}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateField('narID', e.target.value)
        }
      />

      <h2>Units</h2>

      <RadioField
        name='units'
        value={fields.units}
        values={{ Metric: 'si', 'English (US)': 'us' }}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateField('units', e.target.value)
        }
      />
      <div className='flex w-full'>
        <button className='btn w-24' disabled={changed} onClick={doCancel}>
          Cancel
        </button>
        <span className='grow' />
        <button
          className='btn btn-primary w-24'
          disabled={changed}
          onClick={doSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function InputField({
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

function RadioField({
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

function objectDiff(o1: Record<string, unknown>, o2: Record<string, unknown>) {
  for (const key in o1) {
    if (o1[key] !== o2[key]) {
      return true;
    }
  }
  return false;
}

function objectClean<T>(obj: T) {
  for (const key in obj) {
    if (obj[key] == null || obj[key] === '') {
      delete obj[key];
    }
  }
  return obj;
}
