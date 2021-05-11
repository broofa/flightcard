import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { db } from '../firebase';
import { iUser } from '../types';
import { APPNAME, useCurrentLaunch } from './App';
import { Loading } from './util';

export function Waiver({ user } : {user : iUser}) {
  const history = useHistory();
  const [launch] = useCurrentLaunch();

  const [agreedCheck, setAgreedCheck] = useState(false);

  if (!user) return <Loading wat='User' />;
  if (!launch) return <Loading wat='Launch' />;

  function launchAgree() {
    db.attendee.update(launch?.id, user.id, {
      ...user,
      waiverSignedDate: (new Date()).toISOString()
    });
  }

  return <>
    <h1 style={{ textTransform: 'uppercase', textAlign: 'center' }}>
      {'\u2620'} Rockets launches are dangerous {'\u2620'}
    </h1>

    <p>
      It is your responsibility to be informed and aware of the risks involved in attending this event.  Specifically ...
    </p>

    <p>
      <strong>You must meet the requirements set by the event host.</strong>
      <br />
      These may include, but are not limited to: attending safety briefings, following established safety practices, and signing release forms.
      <br />
      <em>If you do not know what these are, contact the event host before proceeding</em>.
    </p>

    <p>
      <strong>{APPNAME} is an experimental application.</strong>
      <br />
      <em>No warranties are providd for {APPNAME}'s function, availability, or correctness.</em>
      <br />
      By using {APPNAME} you are assuming all of the risks, bugs, and other "hiccups" that come with experimental software.  {APPNAME} may fail or be unavailable.  Information {APPNAME} provides may be delayed, incomplete, or incorrect.
    </p>

    <label style={{ color: agreedCheck ? 'green' : 'red' }}>
    <input type='checkbox' className='mr-4 waiver-check'
      checked={agreedCheck}
      onChange={e => setAgreedCheck(e.target.checked)} />
      I have read, understand, and agree to the above terms
    </label>

    <div className='d-flex mt-3'>
      <Button disabled={!agreedCheck} onClick={launchAgree}>I Agree</Button>
      <span className='flex-grow-1' />
      <Button variant='danger' onClick={() => history.goBack()}>I Do Not Agree</Button>
    </div>
  </>;
}
