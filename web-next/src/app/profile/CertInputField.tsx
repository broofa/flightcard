'use client';
import { InputField } from '@/app/profile/InputField';
import type { ErrorResponse } from '@flightcard/common';
import { CertOrg, type CertProps } from '@flightcard/db';
import type { JSX } from 'react';
import { BusySpinner } from '../../../lib/Busy';
import { useDebounce } from '../../../lib/useDebounce';
import { useFetch } from '../../../lib/useFetch';

export function CertInputField({
  value,
  org,
  ...props
}: { org: CertOrg } & React.HTMLProps<HTMLInputElement>) {
  const certField = org === CertOrg.TRA ? 'traID' : 'narID';

  const debouncedValue = useDebounce((value as string) ?? '', 500);
  const certFetch = useFetch(fetchCert, [org, debouncedValue]);

  let certLabel: JSX.Element | undefined;

  const isValid = certFetch.data && certFetch.data.expires > Date.now();

  if (certFetch.isLoading) {
    certLabel = <BusySpinner className='absolute top-1 right-1' size='sm' />;
  } else if (certFetch.error) {
    certLabel = (
      <div className='text-xs text-warning absolute top-0 right-0'>
        Unrecognized member #
      </div>
    );
  } else if (!certFetch.data) {
    certLabel = undefined;
  } else if (certFetch.data.expires < Date.now()) {
    certLabel = (
      <div className='text-xs text-error absolute top-0 right-1'>
        {certFetch.data.firstName} {certFetch.data.lastName} - expired{' '}
        {new Date(certFetch.data.expires).toLocaleDateString()}
      </div>
    );
  } else {
    certLabel = (
      <div className='text-xs text-success absolute top-1 right-1'>
        {certFetch.data.firstName} {certFetch.data.lastName} - expires{' '}
        {new Date(certFetch.data.expires).toLocaleDateString()}
      </div>
    );
  }

  return (
    <InputField
      label={`${certField} #`}
      value={value}
      className='relative'
      {...props}
    >
      {certLabel}
    </InputField>
  );
}

async function fetchCert([certOrg, certID]: [CertOrg, string | undefined]) {
  if (!certID) return;

  const res = await fetch(`/certs?org=${certOrg}&id=${certID}`);
  if (!res.ok) {
    const err = (await res.json()) as ErrorResponse;
    throw new Error(err.error.message);
  }
  return (await res.json()) as CertProps;
}
