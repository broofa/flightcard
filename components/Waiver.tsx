import React, { useRef } from 'react';
import { Button } from 'react-bootstrap';
import { APPNAME } from './App/App';
import { FCLinkButton } from './common/FCLinkButton';
import { useLaunch } from './contexts/LaunchContext';
import { useCurrentUser } from './contexts/rthooks';
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
        {'\u2620'} Rocket launches are dangerous {'\u2620'}
      </h1>

      <p>
        It is your responsibility to be informed and aware of the risks involved
        in attending this event. Specifically ...
      </p>

      <p>
        <strong>You must meet the requirements set by the event host.</strong>
        <br />
        This may include, but is not limited to, attending safety briefings,
        following established safety practices, and signing release forms.
        <br />
        <em className='text-danger'>
          If you do not know what's required of you, contact the event host
          before proceeding
        </em>
        .
      </p>

      <p>
        <strong>{APPNAME} is an experimental application.</strong>
        <br />
        By using {APPNAME} you are assuming all of the risks, bugs, and other
        "hiccups" that come with experimental software. {APPNAME} may fail or be
        unavailable. Information {APPNAME} provides may be delayed, incomplete,
        or incorrect.
        <br />
        <em className='text-danger'>
          No warrantee or guarantees are provided for {APPNAME}, either express
          or implied.
        </em>
      </p>

      <div className='d-flex justify-content-between mt-3'>
        <FCLinkButton variant='danger' to='/'>
          Nope
        </FCLinkButton>
        <Button ref={agreeRef} onClick={launchAgree}>
          I Understand and Agree
        </Button>
      </div>
    </div>
  );
}
