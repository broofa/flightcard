import { sendSignInLinkToEmail } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import { Alert, Button, Form, Modal, type ModalProps } from 'react-bootstrap';
import { busy } from '/components/common/util';
import { auth } from '/rt';
import { APPNAME } from '../App/App';
import { flash } from '../Flash/flash';
import { EMAIL_KEY } from './Login';

export function EmailModal({ from, ...props }: { from: string } & ModalProps) {
  const [email, setEmail] = useState(localStorage.getItem(EMAIL_KEY) ?? '');
  const [emailSent, setEmailSent] = useState(false);
  const sendRef = useRef<HTMLButtonElement>(null);

  async function sendLink() {
    const redirectUrl = new URL(String(location));
    redirectUrl.pathname = from;

    try {
      await busy(
        sendRef.current,
        sendSignInLinkToEmail(auth, email, {
          url: String(redirectUrl),
          handleCodeInApp: true, // This must be true.
        })
      );
      // Stash email address in localStorage so user doesn't have to re-enter it
      localStorage.setItem(EMAIL_KEY, email);
    } catch (err) {
      console.error('Email login failed', err);
      flash(
        <Alert variant='warning'>
          Hmm... something appears to have gone wrong.
        </Alert>
      );
      props.onHide?.();
    }

    setEmailSent(true);
  }

  let title: string, body: JSX.Element, footer: JSX.Element;

  if (emailSent) {
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
          onChange={(e) => setEmail(e.target.value)}
          placeholder='E.g. rory.marshall@example.com'
          required
        />
      </>
    );
    footer = (
      <>
        <Button ref={sendRef ?? undefined} onClick={sendLink}>
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
    <Modal show={true} {...props}>
      <Modal.Title className='mx-3 mt-3'>{title}</Modal.Title>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer className='d-flex justify-content-between'>
        {footer}
      </Modal.Footer>
    </Modal>
  );
}
