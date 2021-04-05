import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import db, { iUser } from '../db';
import { setCurrentUser } from './hooks';

export default function Register() {
  const [user, setUser] = useState<iUser>({
    name: '',
    email: ''
  });

  function setName(e) {
    setUser({ ...user, name: e.target.value });
  }
  function setEmail(e) {
    setUser({ ...user, email: e.target.value });
  }
  function setCertLevel(e) {
    setUser({ ...user, certLevel: parseInt(e.target.value) });
  }
  function setCertType(e) {
    setUser({ ...user, certType: e.target.value });
  }
  function setCertNumber(e) {
    setUser({ ...user, certNumber: parseInt(e.target.value) });
  }
  const [error, setError] = useState<string>('');

  const certDisabled = user.certLevel == null || user.certLevel <= 0;

  async function register() {
    const dbUser = await db.users.get({ email: user.email });
    if (dbUser) {
      if (dbUser.name != user.name) {
        setError(`That's not the name we have on file for ${user.email}`);
      } else {
        setCurrentUser(user);
      }
    } else {
      user.id = await db.users.add(user);
      setCurrentUser(user);
    }
  }

  return <>
    <p>Please tell us about yourself ...</p>
    {error ? <p style={{ backgroundColor: 'pink' }}>{error}</p> : null}

    <div style={{ display: 'grid', gap: '.5em', maxWidth: '20em' }}>
    <input type="text" value={user.name} onChange={setName} placeholder="Name (e.g. Fred Smith)"/>
    <input type="text" value={user.email} onChange={setEmail} placeholder="email (e.g. fred.smith@example.com)"/>

      <h3>High-Power Certification</h3>
      <select id="cert_level" value={user.certLevel} onChange={setCertLevel}>
        <option value="">Cert. Level ...</option>
        <option value="0">None</option>
        <option value="1">Level 1</option>
        <option value="2">Level 2</option>
        <option value="3">Level 3</option>
      </select>

      <select id="cert_type" disabled={certDisabled} value={user.certType} onChange={setCertType} >
        <option value="">Cert. Organization ...</option>
        <option value="TRA">TRA</option>
        <option value="NAR">NAR</option>
      </select>

      <input type="number"
        placeholder="Membership # (e.g. 12345)"
        value={user.certNumber}
        disabled={certDisabled}
        onChange={setCertNumber} />

      <Button onClick={register} style={{ marginTop: '1em' }}>Sign In</Button>
    </div>
  </>;
}
