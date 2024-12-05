'use client';

import { InputField } from '@/app/profile/InputField';
import { Loading } from '@/app/profile/Loading';
import { RadioField } from '@/app/profile/RadioField';
import { useCurrentUser } from '@/app/useCurrentUser';
import type { UserProps } from '@flightcard/db';
import { type ChangeEvent, useState } from 'react';
import { BusyButton } from '../../../lib/Busy';
import { useFetch } from '../../../lib/useFetch';
import { objectEqual } from '@flightcard/common';
import { useDebounce } from '../../../lib/useDebounce';

type UserFormProps = UserProps & { name?: string };

export default function ProfilePage() {
  const [currentUser] = useCurrentUser();
  const [fields, setFields] = useState<UserFormProps>();
  const save = useFetch();
  const traInfo = useFetch();
  const debouncedTraID = useDebounce(fields?.traID, 500);

  

  if (!currentUser) return <Loading wat='User' />;

  if (!fields) {
    setFields(currentUser.props());
    return <Loading wat='Fields' />;
  }

  const changed = !objectEqual(fields, currentUser.props());
  const defaultName = [fields.firstName, fields.lastName]
    .filter(Boolean)
    .join(' ');

  const doCancel = () => {
    setFields(undefined);
  };

  const doSave = async () => {
    const payload = { ...fields };
    // Parse UI-only fields
    const nameParts = payload.name?.split(/\s+/) || [];
    payload.firstName = nameParts.shift()?.trim() || undefined;
    payload.lastName = nameParts.join(' ').trim() || undefined;
    delete payload.name;

    // TODO: HANDLE ERRORS!
    await save.fetch('/worker/users/current', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setFields(currentUser.props());
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
        <BusyButton
          busy={save.busy}
          className='btn btn-primary w-24'
          disabled={changed}
          onClick={doSave}
        >
          Save
        </BusyButton>
      </div>
    </div>
  );
}
