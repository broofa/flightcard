import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
} from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, ModalProps } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { APPNAME } from './App/App';
import { busy } from '/components/common/util';
import { auth } from '/firebase';

// localStorage key where user's email address is stored
const EMAIL_KEY = 'fcEmail';

async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);

    // This gives you a Google Access Token. You can use it to access the Google API.
    // @type {firebase.auth.OAuthCredential}
    // const credential = result.credential;
    // const token = credential.accessToken;
  } catch (err) {
    console.log(err);
  }
}

function EmailModal({ show, ...props }: ModalProps & { show: boolean }) {
  const isRedirect = /apiKey/.test(location.href);
  const [email, setEmail] = useState(localStorage.getItem(EMAIL_KEY) ?? '');
  const [emailSent, setEmailSent] = useState(false);
  const sendRef = useRef<HTMLButtonElement>();
  const [error, setError] = useState<Error & { code: string }>();
  const busyRef = useRef();
  const navigate = useNavigate();

  // Effect: When user is redirected after clicking on email link
  useEffect(() => {
    if (!isRedirect) return;

    if (isSignInWithEmailLink(auth, location.search)) {
      let email = localStorage.getItem(EMAIL_KEY);
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      busy(
        busyRef.current,
        signInWithEmailLink(auth, email ?? '', location.href)
      )
        .then(result => {
          console.log('Login result', result);
          // Clear email from storage.
          // You can access the new user via result.user
          // Additional user info profile not available via:
          // result.additionalUserInfo.profile == null
          // You can check if the user is new or existing:
          // result.additionalUserInfo.isNewUser
          window.localStorage.removeItem(EMAIL_KEY);
        })
        .catch(err => {
          console.error('Login failed', err);
          setError(err);
        });
    }
  }, [isRedirect, navigate]);

  async function sendLink() {
    const redirectUrl = new URL(location as unknown as string);
    redirectUrl.pathname = '/login';

    const sendP = busy(
      sendRef?.current,
      sendSignInLinkToEmail(auth, email, {
        url: String(redirectUrl), // URL user is redirected back to
        handleCodeInApp: true, // This must be true.
      })
    );

    try {
      await sendP;
      // Stash email address in localStorage so user doesn't have to re-enter it
      localStorage.setItem(EMAIL_KEY, email);
    } catch (err) {
      console.error('EMAIL FAILED', err);
    }

    setEmailSent(true);
  }

  let title, body, footer;

  if (isRedirect) {
    // UI for after user clicks email link and gets redirected back here
    title = error ? 'Login Error' : 'Logging In ...';
    let msg;
    switch (error?.code) {
      case 'auth/invalid-action-code':
        msg =
          'Sorry, that login link is no longer valid.  Please go through the login process again to receive a new login email.';
        break;
      case 'auth/invalid-email':
        msg = error.message;
        break;
      default:
        msg = error?.message;
        break;
    }

    body = msg ? <Alert variant='danger'>{msg}</Alert> : null;

    footer = (
      <Button variant='secondary' onClick={() => navigate('/')}>
        Close
      </Button>
    );
  } else if (emailSent) {
    // UI after email is sent
    title = 'Check Your Email';

    body = (
      <>
        <p>
          You should have a message from{' '}
          <strong>noreply@flightcard-63595.firebaseapp.com</strong>. (Be sure to
          check your "Spam" folder as well.)
        </p>

        <p>Follow the instructions in that email to finish logging in.</p>
      </>
    );

    footer = (
      <Button variant='secondary' onClick={props.onHide}>
        Close
      </Button>
    );
  } else {
    // Initial UI, getting user's email address
    title = 'Password-less Email Login';

    body = (
      <>
        <p>
          Please provide your email, then click "Send Login Link". You'll
          receive an email with a link that will log you into {APPNAME}.
        </p>
        <label>Your Email Address</label>
        <Form.Control
          type='email'
          value={email ?? ''}
          onChange={e => setEmail(e.target.value)}
          placeholder='E.g. rory.marshall@example.com'
          required
        />
      </>
    );
    footer = (
      <>
        <Button ref={sendRef ?? null} onClick={sendLink}>
          Send Login Link
        </Button>
        <div className='flex-grow-1' />
        <Button variant='secondary' onClick={props.onHide}>
          Cancel
        </Button>
      </>
    );
  }

  return (
    <Modal show={show || isRedirect} {...props}>
      <Modal.Title className='mx-3 mt-3' ref={busyRef}>
        {title}
      </Modal.Title>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>{footer}</Modal.Footer>
    </Modal>
  );
}

export default function Login() {
  const [showEmailModal, setShowEmailModal] = useState(false);

  return (
    <div className='text-center'>
      <EmailModal
        show={showEmailModal}
        onHide={() => setShowEmailModal(false)}
      />

      <h2 className='my-5'>Welcome to {APPNAME}</h2>
      <Button onClick={loginWithGoogle}>Login with Google</Button>
      <div className='my-3'>Or...</div>
      <Button onClick={() => setShowEmailModal(true)}>Login with Email</Button>
    </div>
  );
}
