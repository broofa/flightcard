import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';

let onError : ((any) => any) | null = null;

// Wrapper function that surfaces errors in ErrorFlash
interface tErrorTrap {
  (action : Promise<any>) : any;
  onError ?: ((err : Error) => void)
}

export function showError(err) {
  onError?.(err);
}

export const errorTrap : tErrorTrap = async (action) => {
  try {
    return await action;
  } catch (err) {
    showError(err);
  }
};

export function ErrorFlash() {
  const [err, setErr] = useState<Error & {code ?: string}>();
  useEffect(() => {
    let timeout = 0;
    function handleError(err : Error) {
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
      title = 'Sorry, you can\'t do that.';
      break;

    default:
      title = err?.message;
      break;
  }

  return err
    ? <Alert variant='danger' className='position-fixed fixed-bottom text-center mb-4 mx-4' style={{
      zIndex: 9999
    }}>
      {title}
    </Alert>
    : null;
}
