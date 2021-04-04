import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import db from '../db';
import { setCurrentUser } from './hooks';

export default function Register() {
  const [name, setName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [certLevel, setCertLevel] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function register() {
    let user = await db.users.get({ email });
    if (user) {
      if (user.name != name) {
        setError(`That's not the name we have on file for ${email}`);
      } else {
        setCurrentUser(user);
      }
    } else {
      user = {
        id: 0,
        name,
        email
      };
      user.id = await db.users.add(user);
      setCurrentUser(user);
    }
  }

  return <>
    <p>Please tell us about yourself ...</p>
    {error ? <p style={{ backgroundColor: 'pink' }}>{error}</p> : null}

    <div style={{ display: 'grid', gap: '.5em', maxWidth: '20em' }}>
    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Fred Smith)"/>
    <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="email (e.g. fred.smith@example.com)"/>

      <h3>High-Power Certification</h3>
      <select id="cert_level" value={certLevel} onChange={e => setCertLevel(parseInt(e.target.value))}>
        <option value="">Cert. Level ...</option>
        <option value="0">None</option>
        <option value="1">Level 1</option>
        <option value="2">Level 2</option>
        <option value="3">Level 3</option>
      </select>

      <select id="cert_org" disabled={(certLevel ?? -1) <= 0} >
        <option value="">Cert. Organization ...</option>
        <option value="TRA">TRA</option>
        <option value="NAR">NAR</option>
      </select>

      <input type="number" placeholder="Membership # (e.g. 12345)" disabled={(certLevel ?? -1) <= 0} />

      <Button onClick={register} style={{ marginTop: '1em' }}>Sign In</Button>
    </div>
  </>;
}
