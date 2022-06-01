import React from 'react';
import { Button } from 'react-bootstrap';
import { auth, util } from '../../../firebase';
import {clear, log} from './AdminLogger';

async function handleClick() {
  const user = auth.currentUser;
  const uid = user?.uid;

  clear();

  async function testAccess(path: string) {
    let canRead, canWrite;
    try {
      await util.get(path);
      canRead = true;
    } catch (err) {}

    try {
      await util.update(path, { _temp: true });
      await util.update(path, { _temp: null });
      canWrite = true;
    } catch (err) {}

    return `${canRead ? '\u2705' : '\u274c'} ${
      canWrite ? '\u2705' : '\u274c'
    } ${path}`;
  }

  await Promise.all([
    testAccess('test/foo'),
    '---',
    testAccess('users'),
    testAccess('users/otherUser'),
    testAccess(`users/${uid}`),
    '---',
    testAccess('attendees'),
    testAccess('attendees/otherLaunch'),
    testAccess('attendees/otherLaunch/otherUser'),
    testAccess(`attendees/fc_launch098/${uid}`),
    '---',
    testAccess('officers'),
    testAccess('officers/testLaunch'),
    testAccess('officers/testLaunch/testUser'),
    testAccess(`officers/testLaunch/${uid}`),
    '---',
    testAccess('cards'),
    testAccess('cards/testLaunch'),
    testAccess('cards/testLaunch/testCard'),
  ]).then(results => results.forEach(v => log(v)));
}

export default function TestDB() {
  return (
    <Button variant='info' onClick={handleClick}>
      Test Database Access
    </Button>
  );
}
