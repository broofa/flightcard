import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { clear, log } from './AdminLogger';
import { auth, rtGet, rtRemove, rtTransaction } from '/rt';
import {
  ATTENDEES_PATH,
  CARDS_PATH,
  LAUNCH_PATH,
  OFFICERS_PATH,
  PADS_PATH,
  USER_PATH,
} from '/rt/rtconstants';
import { RTPath } from '/rt/RTPath';
import {
  DBRoot,
  MOCK_ID_PREFIX,
  createMockData,
} from '/mock/mock_db.js';

// Save in-memory model to the database
async function persistRoot(root: DBRoot) {
  // Users
  const transaction = rtTransaction();
  for (const [authId, user] of Object.entries(root.users)) {
    transaction.update(USER_PATH.with({ authId }), user);
  }

  for (const [launchId, launch] of Object.entries(root.launches)) {
    transaction.update(LAUNCH_PATH.with({ launchId }), launch);
  }

  for (const [launchId, pads] of Object.entries(root.pads)) {
    transaction.update(PADS_PATH.with({ launchId }), pads);
  }

  for (const [launchId, cards] of Object.entries(root.cards)) {
    transaction.update(CARDS_PATH.with({ launchId }), cards);
  }

  for (const [launchId, attendees] of Object.entries(root.attendees)) {
    transaction.update(ATTENDEES_PATH.with({ launchId }), attendees);
  }

  for (const [launchId, officers] of Object.entries(root.officers)) {
    transaction.update(OFFICERS_PATH.with({ launchId }), officers);
  }

  // Log actions to be taken
  for (const [path, state] of Object.entries(transaction.updates)) {
    log(path.toString(), state);
  }

  await transaction.commit();
}

async function unseedDB() {
  for (const collection of [
    'attendees',
    'cards',
    'launches', // First!
    'officers',
    'pads',
    'users',
  ]) {
    log('Purging', collection);
    const collectionPath = new RTPath(':collection', { collection });

    const obj = await rtGet<object>(collectionPath.with({ collection }));
    if (!obj) return;

    await Promise.all(
      Object.keys(obj)
        .filter(key => key.startsWith(MOCK_ID_PREFIX))
        .map(key => {
          const itemPath = collectionPath.append(':key', { key });
          log('Removing', itemPath);
          return rtRemove(itemPath);
        })
    );
  }
}

async function seedDB() {
  await unseedDB();

  const root = createMockData(auth.currentUser?.uid);

  await persistRoot(root);

  log('-- Fin --');
}

export default function MockDB() {
  const [running, setRunning] = useState(false);

  function onSeedClick() {
    if (!confirm('Really regenerate all mocked data?')) return;
    clear();

    setRunning(true);
    seedDB().finally(() => setRunning(false));
  }

  function onUnseedClick() {
    if (!confirm('Really remove all mocked data?')) return;
    clear();

    setRunning(true);
    unseedDB().finally(() => setRunning(false));
  }

  return (
    <>
      <Button disabled={running} variant='warning' onClick={onSeedClick}>
        Mock: Generate
      </Button>

      <Button disabled={running} variant='warning' onClick={onUnseedClick}>
        Mock: Clear
      </Button>
    </>
  );
}
