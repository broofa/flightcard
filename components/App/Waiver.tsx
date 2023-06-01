import React, { useRef } from 'react';
import { Button } from 'react-bootstrap';
import { FCLinkButton } from '../common/FCLinkButton';
import { useCurrentUser, useLaunch } from '../contexts/rthooks';
import { APPNAME } from './App';
import { busy, Loading } from '/components/common/util';
import { rtSet } from '/rt';
import { ATTENDEE_PATH } from '/rt/rtconstants';

export function Waiver() {
  const [launch] = useLaunch();
  const [currentUser] = useCurrentUser();
  const agreeRef = useRef<HTMLButtonElement>(null);

  if (!currentUser) return <Loading wat='User' />;
  if (!launch) return <Loading wat='Launch' />;

  const rtPath = ATTENDEE_PATH.with({
    launchId: launch.id,
    userId: currentUser.id,
  });

  async function launchAgree() {
    await busy(
      agreeRef.current,
      rtSet(rtPath, {
        ...currentUser,
        waiverTime: Date.now(),
      })
    );
  }

  return (
    <div className='m-4'>
      <h1 style={{ textTransform: 'uppercase', textAlign: 'center' }}>
        Rocket launches are dangerous
        <br />
        {'\u2620'} {'\u2620'} {'\u2620'}{' '}
      </h1>

      <p>
        It is your responsibility to be informed and aware of the risks
        involved.{' '}
        <strong>By clicking "I agree", you agree to the following: </strong>
      </p>

      <ul>
        <li>
          You have completed and signed all waiver and release forms required by
          the event hosts.
        </li>

        <li>
          You have been informed of the safety practices put in place by the
          event hosts and agree to abide by them.
        </li>

        <li>
          You agree that {APPNAME} is an experimental application and, as such,
          comes with no warranty as to it's correctness or reliability.
        </li>
      </ul>

      <p>
        On that last point, this app is under active development. It may or may
        not work properly, features may break, information may be missing or
        incorrect, and it may change at a moment's notice.{' '}
        <strong style={{ textDecoration: 'underline' }}>
          Use of {APPNAME} must never replace common sense and the established
          safety practices necessary for the safe operation of a rocket launch.
        </strong>{' '}
      </p>
      <p>
        It is up to you to understand the risks of these events, pay attention,
        and be safe!
      </p>

      <em className='text-danger'>
        If you have questions or are unsure about any of the above, contact the
        event host before proceeding!
      </em>

      <div className='d-flex justify-content-between mt-3'>
        <FCLinkButton variant='danger' to='/launches'>
          Nope
        </FCLinkButton>
        <Button ref={agreeRef} onClick={launchAgree}>
          I Agree
        </Button>
      </div>
    </div>
  );
}
