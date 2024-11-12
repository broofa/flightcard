import { type PropsWithChildren, useState } from 'react';
import { Spinner } from 'react-bootstrap';

export default function Busy({
  promise,
  text,
  ...props
}: PropsWithChildren<{ promise?: Promise<unknown>; text?: string }>) {
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
