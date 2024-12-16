'use client';

import { CertInputField } from '@/app/profile/CertInputField';
import { InputField } from '@/app/profile/InputField';
import { Loading } from '@/app/profile/Loading';
import { RadioField } from '@/app/profile/RadioField';
import { useCurrentUser } from '@/app/useCurrentUser';
import { CertOrg, type UserProps } from '@flightcard/db';
import { type ChangeEvent, useState } from 'react';
import { BusyButton } from '../../../lib/Busy';
import { useFetch } from '../../../lib/useFetch';

type UserFormProps = UserProps & { name?: string };

export default function ProfilePage() {
  const { currentUser } = useCurrentUser();
  const [fields, setFields] = useState<UserFormProps>();
  const [changed, setChanged] = useState(false);
  const [saveFields, setSaveFields] = useState<UserFormProps>();

  const save = useFetch(
    async ([saveFields]) => {
      setSaveFields(undefined);
      await saveUser(saveFields);
    },
    [saveFields]
  );

  if (!currentUser) return <Loading wat='User' />;

  if (!fields) {
    const initFields: UserFormProps = currentUser.props();
    initFields.name = `${initFields.firstName} ${initFields.lastName}`;
    setFields(initFields);
    return;
  }

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

    setSaveFields(fields);
    setChanged(false);
  };

  const updateField = (
    key: keyof UserFormProps,
    value: UserFormProps[typeof key]
  ) => {
    setFields({ ...fields, [key]: value });
    setChanged(true);
  };

  return (
    <div
      className='grid items-center justify-items-center p-8 gap-4'
      suppressHydrationWarning
    >
      <InputField
        label='Email'
        disabled
        value={fields.email}
        onChange={() => {}}
      />

      <div className='flex w-full gap-3'>
        <InputField
          label='Name'
          value={fields.name ?? defaultName}
          placeholder='e.g. Tyler Ramsey'
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateField('name', e.target.value)
          }
        />

        {fields.avatarURL ? (
          <img className='h-12 border p-1 border-dim' src={fields.avatarURL} />
        ) : null}
      </div>

      <h2>Memberships</h2>

      <CertInputField
        org={CertOrg.TRA}
        label='Tripoli #'
        value={fields.traID}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateField('traID', e.target.value)
        }
      />

      <CertInputField
        org={CertOrg.NAR}
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
        <button className='btn w-24' disabled={!changed} onClick={doCancel}>
          Cancel
        </button>

        <span className='grow' />

        <BusyButton
          busy={save.isLoading}
          className='btn btn-primary w-24'
          disabled={!changed}
          onClick={doSave}
        >
          Save
        </BusyButton>
      </div>
    </div>
  );
}

async function saveUser(fields?: UserFormProps) {
  if (!fields) return;

  const payload = { ...fields };

  // Parse UI-only fields
  const nameParts = payload.name?.split(/\s+/) || [];
  payload.firstName = nameParts.shift()?.trim() || undefined;
  payload.lastName = nameParts.join(' ').trim() || undefined;

  await fetch('/worker/users/current', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}
