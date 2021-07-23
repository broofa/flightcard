import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { auth, database, DELETE } from '../firebase';
import { iAttendee, iAttendees, iCard, iCert, iLaunch, iLaunchs, iMotor, iPad, iPads, iPerms, iRocket, iUser, iUsers } from '../types';
import { MKS, Unit, unitParse } from '../util/units';
import { sig } from './common/util';
import { createRocket, NAMES, rnd, rndItem } from './mock_data';

const SEED_PREFIX = 'fc_';
let seedId = 0;
function genId(path) {
  path = path.replace(/\/.*/, '').toLowerCase().replace(/(?:es|s)$/, '');
  return `${SEED_PREFIX}${path}${(seedId++).toString().padStart(3, '0')}`;
}

// "Hey, some sort of logging would be nice, but I don't want to think too hard about it...""
const _log : any = [];
function log(...args) {
  _log.push(args);
  _log.onLog?.();
}
log.clear = () => _log.length = 0;

// "Push" a item into a resource collection, but do it with a human-readable name
// that let's us also detect which items were "seeded" later on so we can remove them.
export async function rtPush<T>(path : string, state : T) : Promise<string> {
  const key = (state as any)?.id || genId(path);
  await database().ref(`${path}/${key}`).set(state);
  return key;
}

async function purge(path) {
  const obj = (await database().ref(path).get()).val();
  if (!obj) return;

  await Promise.all(Object.keys(obj)
    .filter(key => key.startsWith(SEED_PREFIX))
    .map(key => {
      const keyPath = `${path}/${key}`;
      log('Removing', keyPath);
      return database().ref(keyPath).remove();
    }));
}

async function seedUsers() : Promise<iUsers> {
  const RESOURCE = 'users';
  log('Seeding', RESOURCE);

  const ALL : iUser[] = NAMES.slice(0, 100).map(name => {
    name = name + ' \u0307'; // Add a superscript dot so we know who the seeded users are
    const n = Math.random();
    let photoURL : string | null = null;

    if (n < 0.3) {
      photoURL = `https://randomuser.me/api/portraits/men/${rnd(100)}.jpg`;
    } else if (n < 0.6) {
      photoURL = `https://randomuser.me/api/portraits/women/${rnd(100)}.jpg`;
    } else if (n < 0.7) {
      photoURL = `https://randomuser.me/api/portraits/lego/${rnd(10)}.jpg`;
    }

    const user = {
      name,
      id: genId('user'),
      photoURL
    };

    return user as iUser;
  });

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

async function seedLaunches() : Promise<iLaunchs> {
  const RESOURCE = 'launches';

  log('Seeding', RESOURCE);

  const ALL = [
    { name: 'AP Showers', startDate: '2021-04-23', endDate: '2021-04-25' },
    { name: 'Spring Thunder', startDate: '2021-05-21', endDate: '2021-05-23' },
    { name: 'NXRS', startDate: '2021-06-25', endDate: '2021-06-27' },
    { name: 'Summer Skies', startDate: '2021-07-23', endDate: '2021-07-25' },
    { name: 'Sod Blaster (TCR)', startDate: '2021-09-04', endDate: '2021-09-06' },
    { name: 'Fillible\'s Folly', startDate: '2021-09-17', endDate: '2021-09-19' },
    { name: 'Rocketober', startDate: '2021-10-15', endDate: '2021-10-17' }
  ].map(l => ({ id: genId('launch'), host: 'OROC', location: 'Brothers, Oregon', ...l } as iLaunch));

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

async function seedAttendees(launchId : string, users : iUsers) : Promise<iAttendees> {
  const RESOURCE = `attendees/${launchId}`;

  log('Seeding', RESOURCE);

  const ATTENDEES = Object.values(users).slice(0, 20);

  // Seed attendees
  const ALL : iAttendee[] = ATTENDEES.map(user => {
    const cert = {
      level: rndItem([0, 0, 1, 1, 1, 2, 2, 2, 3])
    } as iCert;

    if (cert.level) {
      cert.type = rndItem(['tra', 'nar']);
      cert.number = (3000 + rnd(15000));
      cert.expires = (new Date(Date.now() + rnd(365 * 24 * 3600e3))).toLocaleDateString();
      if (Math.random() < 0.3) {
        cert.verifiedId = rndItem(ATTENDEES).id;
        cert.verifiedTime = Date.now();
      }
    }

    return {
      ...user,
      cert

      // Coords around Brothers, OR
      // lat: 43.7954 + Math.random() * 0.0072,
      // lon: -120.6535 + Math.random() * 0.0109
    } as iAttendee;
  });

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

async function seedOfficers(launchId : string, users : iAttendees) {
  const RESOURCE = `officers/${launchId}`;
  log('Seeding', RESOURCE);

  const firstOfficer = auth().currentUser?.uid;
  if (!firstOfficer) throw Error('No current user(?!?)');

  // Make sure current owner is an officer
  const officers : iPerms = { [firstOfficer]: true };

  Object.values(users).forEach((attendee, i) => {
    if ((attendee.cert?.level ?? -1) >= 2 && (i % 10) < 4) {
      officers[attendee.id] = true;
    }
  });
  await database().ref(RESOURCE).set(officers);
}

async function seedPads(launchId : string) {
  const RESOURCE = `pads/${launchId}`;

  log('Seeding', RESOURCE);

  // Seed pads
  const ALL : iPad[] = [];
  const PADS = [
    { name: '1-1', group: 'Low-Power' },
    { name: '1-2', group: 'Low-Power' },
    { name: '1-3', group: 'Low-Power' },
    { name: '1-4', group: 'Low-Power' },

    { name: '2-1', group: 'Mid-Power' },
    { name: '2-2', group: 'Mid-Power' },
    { name: '2-3', group: 'Mid-Power' },
    { name: '2-4', group: 'Mid-Power' },

    { name: '3-1', group: 'High-Power' },
    { name: '3-2', group: 'High-Power' },
    { name: '3-3', group: 'High-Power' },
    { name: '3-4', group: 'High-Power' },
    { name: '4-1', group: 'High-Power' },
    { name: '4-2', group: 'High-Power' },
    { name: '4-3', group: 'High-Power' },
    { name: '4-4', group: 'High-Power' },

    { name: 'Away Cell' },
    { name: 'Hilltop' }
  ];

  // Seed pads
  const padIds : string[] = [];
  for (const pad of PADS) {
    const id = genId('pad');
    padIds.push(id);
    ALL.push({ ...pad, id, launchId });
  }

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

async function seedCards(launchId : string, attendees : iAttendees, pads : iPads) {
  const RESOURCE = `cards/${launchId}`;

  log('Seeding', RESOURCE);

  // Seed cards
  const ALL : iCard[] = [];
  for (const userId of Object.keys(attendees)) {
    for (let i = 0; i < 4; i++) {
      const rocket = createRocket();

      const { _motor: motor } = rocket as iRocket & {_motor ?: iMotor};
      delete rocket._motor;

      const status = [DELETE, 'review', 'ready', 'done'][i];

      const id = genId('card');
      const padId = /ready|done/.test(status ?? '') ? rndItem(Object.keys(pads)) : DELETE;

      ALL.push({
        id,

        status,

        launchId,
        userId,
        padId,

        firstFlight: Math.random() < 0.2 || DELETE,
        headsUp: Math.random() < 0.2 || DELETE,
        complex: Math.random() < 0.2 || DELETE,
        notes: 'Randomly generated flight card',

        rocket,
        motor
      } as iCard);
    }
  }

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

let seeding = false;
async function seedDB() {
  if (seeding) return;
  if (!confirm('Are you sure?  This will remove all previously seeded launch state.')) return;
  seeding = true;
  log.clear();
  seedId = 0;

  try {
    for (const att of [
      'users',
      'launches',
      'attendees',
      'officers',
      'pads',
      'cards'
    ]) {
      log('Purging', att);
      await purge(att);
    }

    const [users, launches] = await Promise.all([
      seedUsers(),
      seedLaunches()
    ]);
    let first = true;
    for (const launch of Object.values(launches)) {
      const pads = await seedPads(launch.id);

      if (!first) continue;
      first = true;

      const attendees = await seedAttendees(launch.id, users);
      await seedOfficers(launch.id, attendees);
      await seedCards(launch.id, attendees, pads);
    }
  } catch (err) {
    log(err);
  } finally {
    log('-- fin --');
    seeding = false;
  }
}

async function testDB() {
  const user = auth().currentUser;
  const uid = user?.uid;

  log.clear();

  async function testAccess(path) {
    const ref = database().ref(path);

    let canRead, canWrite;
    try {
      (await ref.get()).val();
      canRead = true;
    } catch (err) { }

    try {
      await ref.update({ _temp: true });
      await ref.update({ _temp: null });
      canWrite = true;
    } catch (err) { }

    return `${canRead ? '\u2705' : '\u274c'} ${canWrite ? '\u2705' : '\u274c'} ${path}`;
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
    testAccess('cards/testLaunch/testCard')
  ]).then(results => results.forEach(v => log(v)));
}

function testUtil() {
  log.clear();
  log('Starting tests');

  function expectUnit(v : string, unit : string, expected : number | string) {
    let actual;
    try {
      actual = sig(unitParse(v, unit) as number, 4);
    } catch (err) {
      actual = err.message;
    }

    if (actual === expected) {
      log('\u2705', v, 'to', unit, '=', expected);
    } else {
      log('\u274c', v, 'to', unit, '=', String(actual), `(expected ${expected})`);
    }
  }

  // Misc
  expectUnit('1.23', MKS.mass, 1.23); // unitless
  expectUnit('-1.23', MKS.mass, -1.23); // negative
  expectUnit('1ft', MKS.mass, 'Failed to convert 1 from ft to kg'); // incompatible units

  // Incompatible units

  // Metric units
  expectUnit('1m', MKS.length, 1);
  expectUnit('1kg', MKS.mass, 1);
  expectUnit('1n', MKS.force, 1);
  expectUnit('1n-s', MKS.impulse, 1);
  expectUnit('1n-sec', MKS.impulse, 1);

  // US length
  expectUnit('1ft', MKS.length, 0.3048);
  expectUnit('1 ft', MKS.length, 0.3048);
  expectUnit('1 FT', MKS.length, 0.3048);
  expectUnit('1\'', MKS.length, 0.3048);
  expectUnit('1in', MKS.length, 0.0254);
  expectUnit('1"', MKS.length, 0.0254);
  expectUnit('1ft1in', MKS.length, 0.3302);
  expectUnit('1 ft 1 in', MKS.length, 0.3302);
  expectUnit('1ft 1in', MKS.length, 0.3302);
  expectUnit('1cm', MKS.length, 0.01);
  expectUnit('1mm', MKS.length, 0.001);

  // test mass
  expectUnit('1lb', MKS.mass, 0.4536);
  expectUnit('1oz', MKS.mass, 0.02835);
  expectUnit('1lb1oz', MKS.mass, 0.4819);
  expectUnit('1g', MKS.mass, 0.001);

  // test force
  expectUnit('1lbf', MKS.force, 4.448);

  // test impulse
  expectUnit('1lbf-s', MKS.impulse, 4.448);
  expectUnit('1lbf-sec', MKS.impulse, 4.448);

  const v = new Unit(123, 'kg');
  log('HELLO', v);
}

export default function Admin() {
  const [, setLogLength] = useState(_log.length);

  // Trigger re-render when log changes
  _log.onLog = () => setLogLength(_log.length);

  return <>
    <div className='deck'>
      <Button variant='warning' onClick={seedDB} >Seed DB</Button>
      <Button variant='warning' onClick={testDB} >Test Access</Button>
      <Button variant='warning' onClick={testUtil} >Test util</Button>
    </div>
    <div className='mt-4 text-dark text-monospace' style={{ fontSize: '9pt' }}>
      {
        _log.map((args, i) => {
          const err = args.find(v => v instanceof Error);
          return <div key={i} className={err ? 'text-danger' : ''}>{args.join(' ')}</div>;
        })
      }
    </div>
  </>;
}
