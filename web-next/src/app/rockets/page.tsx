'use client';

import { InputField } from '@/app/profile/InputField';
import { Recovery, type RocketProps } from '@flightcard/db';
import { type ChangeEvent, useState } from 'react';
import { BusyButton, BusySpinner } from '../../../lib/Busy';
import { cn } from '../../../lib/cn';
import { useFetch } from '../../../lib/useFetch';

type RocketFormProps = RocketProps;

export default function ProfilePage() {
  const [fields, setFields] = useState<RocketFormProps>();
  const [changed, setChanged] = useState(false);
  const [saveFields, setSaveFields] = useState<RocketFormProps>();

  const save = useFetch(
    async ([saveFields]) => {
      setSaveFields(undefined);
      await saveRocket(saveFields);
    },
    [saveFields]
  );

  if (!fields) {
    setFields({ rocketID: crypto.randomUUID() });
    return <BusySpinner />;
  }

  const doCancel = () => {
    setFields(undefined);
  };

  const doSave = async () => {
    const payload = { ...fields };
    // Parse UI-only fields
    delete payload.name;

    setSaveFields(fields);
    setChanged(false);
  };

  const updateField = (
    key: keyof RocketFormProps,
    value: RocketFormProps[typeof key]
  ) => {
    setFields({ ...fields, [key]: value });
    setChanged(true);
  };

  return (
    <div
      className='grid p-8 gap-4'
      suppressHydrationWarning
    >
      <div className='flex w-full gap-3'>
        <InputField
          label='Rocket Name'
          value={fields.name ?? ''}
          placeholder='Unnamed Rocket'
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateField('name', e.target.value)
          }
        />

        <div className='bg-red-500 w-12 text-white p-2 rounded-box'> </div>
      </div>

      <div className='flex flex-wrap gap-4'>
        <InputField
          label='Manufacturer'
          className='w-min'
          value={fields.manufacturer ?? ''}
          placeholder='e.g. "Mega Der Red Max" or "Scratch"'
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateField('manufacturer', e.target.value)
          }
        />

        <InputField
          label='Diameter'
          className='w-min'
          value={fields.diameter ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateField('diameter', e.target.value)
          }
        />

        <InputField
          label='Length'
          className='w-min'
          value={fields.length ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateField('length', e.target.value)
          }
        />

        <InputField
          label='Mass'
          className='w-min'
          value={fields.mass ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateField('mass', e.target.value)
          }
        />
      </div>

      <label className='form-control'>
        <div className='label'>
          <span className='label-text'>Recovery</span>
        </div>

        <select
          className={cn(
            { 'select-warning': !fields.recovery },
            'select select-bordered w-max'
          )}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            updateField('recovery', e.target.value)
          }
        >
          <option value={''}>Unspecified</option>
          <option value={Recovery.CHUTE}>Chute</option>
          <option value={Recovery.STREAMER}>Streamer</option>
          <option value={Recovery.DUAL_DEPLOY}>Dual-Deploy</option>
          <option value={Recovery.TUMBLE}>Tumble</option>
          <option value={Recovery.GLIDE}>Glide</option>
          <option value={Recovery.HELICOPTER}>Helicopter</option>
        </select>
      </label>

      <div className='divider  w-full'>🚀</div>

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

async function saveRocket(fields?: RocketFormProps) {
  if (!fields) return;

  const payload = { ...fields };

  await fetch(`/worker/rockets/${fields.rocketID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}
