import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import React, { ReactElement, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { APPNAME } from '../App/App';
import { EmailModal } from './EmailModal';
import './Login.scss';
import { auth } from '/rt';

// localStorage key where user's email address is stored
export const EMAIL_KEY = 'fcEmail';

export default function Login() {
  const location = useLocation() as { state: { from: Location } };
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [flash, setFlash] = useState<ReactElement>();
  const busyRef = useRef(null);

  const from = location.state?.from?.pathname || '/';

  const navigate = useNavigate();

  async function loginWithGoogle() {
    // REF: https://firebase.google.com/docs/auth/web/google-signin

    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      navigate(from);
    } catch (err) {
      console.log(err);
    }
  }

  function doEmailLogin() {
    setFlash(undefined);
    setShowEmailModal(true);
  }

  return (
    <div id='login_page' className='text-center'>
      {showEmailModal ? (
        <EmailModal
          from={from}
          onHide={() => setShowEmailModal(false)}
          setFlash={(el: ReactElement) => setFlash(el)}
        />
      ) : null}

      <h2 className='my-5'>Welcome to {APPNAME}</h2>

      <Button onClick={loginWithGoogle}>Login with Google</Button>
      <div className='my-3'>Or...</div>
      <Button ref={busyRef} onClick={doEmailLogin}>
        Login with Email
      </Button>

      <div className='mx-5 mt-3'>{flash}</div>
    </div>
  );
}
