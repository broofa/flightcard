import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup,
} from 'firebase/auth';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { APPNAME } from '../App/App';
import { busy } from '../common/util';
import { EmailModal } from './EmailModal';
import { auth } from '/rt';
import './Login.scss';


// localStorage key where user's email address is stored
export const EMAIL_KEY = 'fcEmail';

export default function Login() {
  const { href } = window.location;
  const location = useLocation() as { state: { from: Location } };
  const isRedirect = isSignInWithEmailLink(auth, href);
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

  // Effect: When user is redirected after clicking on email link
  useEffect(() => {
    if (!isRedirect) return;

    const busyEl = busyRef.current;
    if (!busyEl) return;

    if (busyEl) {
      let email = localStorage.getItem(EMAIL_KEY);
      if (!email) {
        email = window.prompt(
          'To finish signing in, please confirm the email you used to sign up:'
        );
      }

      busy(busyEl, signInWithEmailLink(auth, email ?? '', href))
        .then(userCredential => {
          window.localStorage.removeItem(EMAIL_KEY);
          const userInfo = getAdditionalUserInfo(userCredential);
          if (userInfo?.isNewUser) {
            setFlash(<Alert variant='success'>Welcome to FlightCard!</Alert>);
          } else {
            setFlash(<Alert variant='success'>Welcome back!</Alert>);
          }

          navigate(from);
        })
        .catch((err: Error & { code: string }) => {
          console.error('Login failed', err);
          switch (err?.code) {
            case 'auth/invalid-action-code':
              setFlash(
                <Alert variant='warning'>
                  Sorry, that login link is no longer valid. Please try logging
                  in again.
                </Alert>
              );
              break;
            case 'auth/invalid-email':
            default:
              setFlash(<Alert variant='danger'>{err?.message}</Alert>);
              break;
          }
        });
    }
  }, [isRedirect, href, navigate, from]);

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
