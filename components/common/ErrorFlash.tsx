import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';

let onError: ((err: Error) => void) | null = null;

// Wrapper function that surfaces errors in ErrorFlash
export function showError(err: Error) {
  console.error('showError()', err);
  onError?.(err);
}

export function errorTrap<T>(action: Promise<T>): Promise<T> {
  action.catch(showError);
  return action;
}

export function ErrorFlash() {
  const [err, setErr] = useState<Error & { code?: string }>();
  useEffect(() => {
    let timeout = 0;
    function handleError(err: Error) {
      setErr(err);
      clearTimeout(timeout);
      timeout = window.setTimeout(() => setErr(undefined), 4000);
    }

    onError = handleError;

    return () => {
      clearTimeout(timeout);
      onError = null;
    };
  }, []);

  let title = err?.message;
  switch (err?.code) {
    case 'PERMISSION_DENIED':
      title = "Sorry, you can't do that.";
      break;

    default:
      title = err?.message;
      break;
  }

  return err ? (
    <Alert
      variant='danger'
      className='position-fixed fixed-bottom text-center mb-4 mx-4'
      style={{
        zIndex: 9999,
      }}
    >
      {title}
    </Alert>
  ) : null;
}
