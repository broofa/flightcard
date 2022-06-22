import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { APPNAME } from './App/App';
import { FCLinkButton } from './common/FCLinkButton';
import { useLaunch } from './contexts/LaunchContext';
import { useCurrentUser } from './contexts/rthooks';
import { Loading } from '/components/common/util';
import { db } from '/rt';

export function Waiver() {
  const [launch] = useLaunch();
  const [currentUser] = useCurrentUser();

  const [agreedCheck, setAgreedCheck] = useState(false);

  if (!currentUser) return <Loading wat='User' />;
  if (!launch) return <Loading wat='Launch' />;

  const launchAgree = () => {
    db.attendee.update(launch?.id, currentUser.id, {
      ...currentUser,
      waiverTime: Date.now(),
    });
  };

  return (
    <>
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
        These may include, but are not limited to: attending safety briefings,
        following established safety practices, and signing release forms.
        <br />
        <em>
          If you do not know what these are, contact the event host before
          proceeding
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
        <em>No warranties are provided for {APPNAME}.</em>
      </p>

      <label style={{ color: agreedCheck ? 'green' : 'red' }}>
        <input
          type='checkbox'
          className='me-4'
          checked={agreedCheck}
          onChange={e => setAgreedCheck(e.target.checked)}
        />
        I understand and agree to the above terms
      </label>

      <div className='d-flex justify-content-between mt-3'>
        <FCLinkButton variant='danger' to='/'>
          I Do Not Agree
        </FCLinkButton>
        <Button disabled={!agreedCheck} onClick={launchAgree}>
          I Agree
        </Button>
      </div>
    </>
  );
}
