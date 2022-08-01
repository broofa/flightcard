import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { clear, log } from './AdminLogger';
import { createRocket, NAMES, rnd, rndItem } from './mock_data';
import { auth, DELETE, rtGet, rtRemove, rtTransaction } from '/rt';
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
  CardStatus,
  CertOrg,
  iAttendees,
  iCard,
  iCards,
  iCert,
  iLaunches,
  iMotor,
  iOfficers,
  iPads,
  iRocket,
  iUsers,
} from '/types';

const MOCK_ID_PREFIX = 'FC_';

const MOCK_NAME_SUFFIX = '(Test)';

const LAUNCH_NAMES = [
  'AP Showers',
  'Spring Thunder',
  'NXRS',
  'Summer Skies',
  'Sod Blaster (TCR)',
  'Rocketober',
  "Fillible's Folly",
  'The Arbuckle Classic',
  'Independence Day',
];

const PADS = [
  { name: '1-1', group: 'Low-Power' },
  { name: '1-2', group: 'Low-Power' },
  { name: '1-3', group: 'Low-Power' },
  { name: '1-4', group: 'Low-Power' },

  { name: '2-1', group: 'Mid-Power' },
  { name: '2-2', group: 'Mid-Power' },
  { name: '2-3', group: 'Mid-Power' },
  { name: '2-4', group: 'Mid-Power' },

  { name: '3-1', group: 'High-Power (west)' },
  { name: '3-2', group: 'High-Power (west)' },
  { name: '3-3', group: 'High-Power (west)' },
  { name: '3-4', group: 'High-Power (west)' },

  { name: '4-1', group: 'High-Power (east)' },
  { name: '4-2', group: 'High-Power (east)' },
  { name: '4-3', group: 'High-Power (east)' },
  { name: '4-4', group: 'High-Power (east)' },

  { name: 'Away Cell' },
  { name: 'Hilltop' },
];

let seedIds: Record<string, number> = {};
function genId(idType = 'id') {
  const id = (seedIds[idType] = (seedIds[idType] ?? 0) + 1);
  return `${MOCK_ID_PREFIX}${idType}_${String(id).padStart(2, '0')}`;
}
function genReset() {
  seedIds = {};
}

type DBRoot = {
  attendees: Record<string, iAttendees>;
  cards: Record<string, iCards>;
  launches: iLaunches;
  officers: Record<string, iOfficers>;
  pads: Record<string, iPads>;
  users: iUsers;
};

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
    log(String(path), state);
  }

  await transaction.commit();
}

function mockRoot(): DBRoot {
  return {
    attendees: {},
    cards: {},
    launches: {},
    officers: {},
    pads: {},
    users: {},
  };
}

async function mockUsers(root: DBRoot) {
  const names = new Set<string>();
  while (names.size < 20) names.add(rndItem(NAMES));
  for (let name of names) {
    name = `${name} ${MOCK_NAME_SUFFIX}`; // Mock users get a little dot appended to their name

    const n = Math.random();
    let photoURL: string | undefined = DELETE;

    if (n < 0.3) {
      photoURL = `https://randomuser.me/api/portraits/men/${rnd(100)}.jpg`;
    } else if (n < 0.6) {
      photoURL = `https://randomuser.me/api/portraits/women/${rnd(100)}.jpg`;
    } else if (n < 0.7) {
      photoURL = `https://randomuser.me/api/portraits/lego/${rnd(10)}.jpg`;
    }

    const id = genId('user');
    root.users[id] = { id, name, photoURL };
  }

  return root;
}

function mockLaunches(root: DBRoot) {
  for (const [i, name] of LAUNCH_NAMES.entries()) {
    const host = rndItem([
      { host: 'OROC', location: 'Brothers, OR' },
      { host: 'TCR', location: 'Pasco, WA' },
    ]);

    const startDate = new Date(Date.now() + (i - 2) * 30 * 24 * 3600e3);
    const endDate = new Date(startDate.getTime() + 3 * 24 * 3600e3);

    const id = genId('launch');
    root.launches[id] = {
      rangeOpen: false,
      id,
      name: `${name} ${MOCK_NAME_SUFFIX}`,
      ...host,
      startDate: startDate.toISOString().replace(/T.*/, ''),
      endDate: endDate.toISOString().replace(/T.*/, ''),
    };
  }
}

function mockAttendees(root: DBRoot, launchId?: string) {
  if (!launchId) {
    for (const launchId of Object.keys(root.launches)) {
      mockAttendees(root, launchId);
    }
    return;
  }

  if (!(launchId in root.launches)) throw Error(`No launch ${launchId}`);

  root.attendees[launchId] = {};

  const uid = auth.currentUser?.uid;
  if (uid) {
    root.attendees[launchId][uid] = {
      id: uid,
      name: 'You!',
      waiverTime: Date.now(),
    };
  }

  for (const user of Object.values(root.users).slice(0, 20)) {
    const cert = {
      level: rndItem([0, 0, 1, 1, 1, 2, 2, 2, 3]),
    } as iCert;

    if (cert.level) {
      cert.organization = rndItem([CertOrg.NAR, CertOrg.TRA]);
      cert.memberId = 3000 + rnd(15000);
      cert.expires = Date.now() + rnd(365 * 24 * 3600e3);
    }

    const attendee = {
      ...user,
      cert,
      waiverTime:
        Math.random() < 0.95
          ? Date.now() - Math.random() * 365 * 24 * 3600e3
          : DELETE,

      // Coords around Brothers, OR
      // lat: 43.7954 + Math.random() * 0.0072,
      // lon: -120.6535 + Math.random() * 0.0109
    };
    root.attendees[launchId][attendee.id] = attendee;
  }

  return root;
}

function mockOfficers(root: DBRoot, launchId?: string) {
  if (!launchId) {
    for (const launchId of Object.keys(root.launches)) {
      mockOfficers(root, launchId);
    }
    return;
  }

  const attendees = Object.values(root.attendees[launchId]);
  root.officers[launchId] = {};

  // Designate officers
  for (let i = 0; i < attendees.length / 5; i++) {
    root.officers[launchId][rndItem(attendees).id] = true;
  }

  // Current user should be an officer
  if (auth.currentUser?.uid) {
    root.officers[launchId][auth.currentUser.uid] = true;
  }
  for (const attendee of attendees) {
    if (attendee.cert?.level && Math.random() < 0.5) {
      attendee.cert.verifiedId = rndItem(Object.keys(root.officers[launchId]));
      attendee.cert.verifiedTime =
        Date.now() - Math.random() * 365 * 24 * 3600e3;
    }
  }
}

function mockPads(root: DBRoot, launchId?: string) {
  if (!launchId) {
    for (const launchId of Object.keys(root.launches)) {
      mockPads(root, launchId);
    }
    return;
  }

  root.pads[launchId] = {};

  // Seed pads
  for (const pad of PADS) {
    const id = genId('pad');
    root.pads[launchId][id] = { id, ...pad };
  }
}

function _mockCard(
  props: {
    launchId: string;
    userId: string;
    status: CardStatus;
  } & Partial<iCard>
): iCard {
  const id = genId('card');
  const rocket = createRocket();

  const { _motor: motor } = rocket as iRocket & { _motor?: iMotor };
  delete rocket._motor;
  if (motor) {
    motor.id = genId('motor');
  }

  return {
    id,

    firstFlight: Math.random() < 0.2 || DELETE,
    headsUp: Math.random() < 0.2 || DELETE,
    complex: Math.random() < 0.2 || DELETE,
    notes: 'Randomly generated flight card',

    rocket,
    motors: motor ? { [motor.id]: motor } : DELETE,

    ...props,
  };
}

async function mockCards(root: DBRoot, launchId?: string) {
  if (!launchId) {
    for (const launchId of Object.keys(root.launches)) {
      mockCards(root, launchId);
    }
    return;
  }

  const padIds = Object.keys(root.pads[launchId]);
  const officers = Object.keys(root.officers[launchId]);

  root.cards[launchId] = {};

  // Number of cards to create for this user
  const cardDistributions: [CardStatus, number][] = [
    [CardStatus.DRAFT, 2],
    [CardStatus.REVIEW, 3],
    [CardStatus.FLY, 3],
    [CardStatus.DONE, 5],
  ];

  // Seed cards for each user
  let nCards = 0;
  for (const userId of Object.keys(root.attendees[launchId])) {
    for (const [status, n] of cardDistributions) {
      for (let i = 0; i < n; i++) {
        let rsoId: string | undefined = DELETE;
        let padId: string | undefined = DELETE;
        let lcoId: string | undefined = DELETE;

        if (status === CardStatus.DRAFT) {
          // Mark some cards as ready for RSO review
          if (nCards % 2) rsoId = rndItem(officers);
        } else if (status === CardStatus.FLY) {
          // FLY requires RSO sign-off
          rsoId = rndItem(officers);
          // Assign some cards to pads
          if (nCards % 3) padId = rndItem(padIds);
        } else if (status === CardStatus.DONE) {
          // Completed flights
          lcoId = rndItem(officers);
          rsoId = rndItem(officers);
          padId = rndItem(padIds);
        }

        const card = _mockCard({
          launchId,
          userId,
          rsoId,
          lcoId,
          status,
          padId,
        });

        root.cards[launchId][card.id] = card;

        nCards++;
      }
    }
  }

  return root;
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

  genReset();

  const root = mockRoot();
  mockUsers(root);
  mockLaunches(root);
  mockAttendees(root);
  mockOfficers(root);
  mockPads(root);
  mockCards(root);

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
