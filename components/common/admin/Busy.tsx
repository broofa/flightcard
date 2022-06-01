import React, { PropsWithChildren, useState } from 'react';
import { Spinner } from 'react-bootstrap';

export default function Busy({
  promise,
  text,
  ...props
}: PropsWithChildren<{ promise?: Promise<any>; text?: string }>) {
  const [busy, setBusy] = useState(true);
  promise?.then(() => setBusy(false));
  return (
    <>
      <span {...props}>{text}</span>
      {busy ? (
        <Spinner variant='secondary' animation='grow' size='sm' role='status' />
      ) : null}
    </>
  );
}
