import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { APPNAME } from '../App/App';
import { flash } from '../common/Flash';
import { loginUpdateUser } from '../contexts/AuthIdContext';
import { EmailModal } from './EmailModal';
import './Login.scss';
import { auth } from '/rt';

// localStorage key where user's email address is stored
export const EMAIL_KEY = 'fcEmail';

export default function Login() {
  const location = useLocation() as { state: { from: Location } };
  const [showEmailModal, setShowEmailModal] = useState(false);
  const busyRef = useRef(null);

  const from = location.state?.from?.pathname || '/';

  const navigate = useNavigate();

  async function loginWithGoogle() {
    // REF: https://firebase.google.com/docs/auth/web/google-signin

    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);

      await loginUpdateUser(result.user);

      navigate(from);
    } catch (err) {
      flash(err as Error);
    }
  }

  function doEmailLogin() {
    setShowEmailModal(true);
  }

  return (
    <div id='login_page' className='text-center'>
      {showEmailModal ? (
        <EmailModal from={from} onHide={() => setShowEmailModal(false)} />
      ) : null}

      <h2 className='my-5'>Welcome to {APPNAME}</h2>

      <Button onClick={loginWithGoogle}>Login with Google</Button>
      <div className='my-3'>Or...</div>
      <Button ref={busyRef} onClick={doEmailLogin}>
        Login with Email
      </Button>
    </div>
  );
}
