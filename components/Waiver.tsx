import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { db } from '../firebase';
import { APPNAME } from './App';
import { iLaunchUser, iUser } from '../types';
import { Loading } from './util';

function launchAgree(launchId : string, user : iUser) {
  // IMPORTANT: This action needs to be legally discoverable!
  const launchUser : iLaunchUser = {
    ...user,
    verified: false,
    waiverSignedDate: (new Date()).toISOString()
  };
  db.launchUser.update(launchId, user.id, launchUser);
}

export function Waiver({ userId, launchId } : {userId : string, launchId : string}) {
  const history = useHistory();
  const user = db.user.useValue(userId);
  const TERMS = [
    'I understand and agree to the above terms',
    'I meet all requirements set by the event organizers (e.g. membership, release forms, age requirements, etc.)'
  ];
  const checkStates = TERMS.map(() => useState(false));

  if (!user) return <Loading wat="User" />;
  if (!launchId) return <Loading wat="Launch ID" />;

  const allChecked = checkStates.reduce((a, [b]) => a && b, true);

  return <>
    <h1 style={{ textTransform: 'uppercase', textAlign: 'center' }}>
      {'\u2620'} Rockets launches are dangerous {'\u2620'}
    </h1>

    <p style={{ fontWeight: 'bold' }}>
    </p>

    <p>
      <strong>By attending this event you are accepting the inherent risks</strong>.
       It is your responsibility to work with the event organizers to make sure you understand the risks and required safety practices prior to attending.
    </p>

    <p>
      <strong>{APPNAME} is experimental software</strong>. {APPNAME} should never be used to supplant or circumvent existing safety practices.  Information it provides may be incorrect, delayed, or missing.  Double check everything it tells you, especially where the status of the range and flight line are concerned!
    </p>

    <ul>{checkStates.map(([checked, setChecked], i) => <li key={i} style={{ listStyle: 'none', color: checked ? 'green' : 'red' }}>
      <label>
        <input type="checkbox" style={{ marginRight: '.5em' }}
          className="waiver-check"
          onChange={e => setChecked(e.target.checked)} />
        {TERMS[i]}
      </label>
    </li>
    )}</ul>

    <div className="d-flex">
      <Button disabled={!allChecked} onClick={() => launchAgree(launchId, user)}>I Agree</Button>
      <span className="flex-grow-1" />
      <Button variant='danger' onClick={() => history.goBack()}>I Do Not Agree</Button>
    </div>
  </>;
}
