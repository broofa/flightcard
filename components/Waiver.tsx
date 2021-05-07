import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { db } from '../firebase';
import { iUser } from '../types';
import { APPNAME, useCurrentLaunch } from './App';
import { Loading } from './util';

function TermCheck({ title, state: [checked, setChecked] }) {
  return <label style={{ color: checked ? 'green' : 'red' }}>
    <input type='checkbox' className='mr-4 waiver-check'
      checked={checked}
      onChange={e => setChecked(e.target.checked)} />
    {title}
  </label>;
}

export function Waiver({ user } : {user : iUser}) {
  const history = useHistory();
  const [launch] = useCurrentLaunch();

  const eventTerm = useState(false);
  const appTerm = useState(false);

  if (!launch) return <Loading wat='Launch' />;

  const allChecked = eventTerm[0] && appTerm[0];

  function launchAgree() {
    db.attendee.update(launch?.id, user.id, {
      ...user,
      waiverSignedDate: (new Date()).toISOString()
    });
  }

  return <>
    <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', textAlign: 'center' }}>
      {'\u2620'} Rockets launches are dangerous {'\u2620'}
    </h1>

    <p>
      <strong>You must meet the requirements set by the event host.</strong>
      These may include: attending safety briefings, adhering to certiaain safety practices, and signing release forms.
    </p>
    <p>
      <em>If you do not know what these are, contact the event host before proceeding</em>.
    </p>

    <TermCheck title='I meet all requirements set by the event host' state={eventTerm} />

    <p>
      <strong>{APPNAME} is experimental software</strong>.  All information it provides must be verified with the appropriate source prior to acting on it.  This is especially true when it comes to actions that may affect personal safety.
    </p>

    <TermCheck title={`I will verify all information provided by ${APPNAME} prior to acting on that information`} state={appTerm} />

    <div className='d-flex mt-3'>
      <Button disabled={!allChecked} onClick={launchAgree}>I Agree</Button>
      <span className='flex-grow-1' />
      <Button variant='danger' onClick={() => history.goBack()}>I Do Not Agree</Button>
    </div>
  </>;
}
