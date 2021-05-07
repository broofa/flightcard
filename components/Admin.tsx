import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { auth, database, DELETE } from '../firebase';
import { iAttendee, iAttendees, iCard, iCert, iLaunch, iLaunchs, iPad, iPads, iPerms, iUser, iUsers } from '../types';
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
  // console.log(...args);
}
log.clear = () => _log.length = 0;

// "Push" a item into a resource collection, but do it with a human-readable name
// that let's us also detect which items were "seeded" later on so we can remove them.
export async function rtPush<T>(path : string, state : T) : Promise<string> {
  const key = (state as any)?.id || genId(path);
  await database().ref(`${path}/${key}`).set(state);
  return key;
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
    { name: 'AP Showers', startDate: 'April 23', endDate: 'April 25' },
    { name: 'Spring Thunder', startDate: 'May 21', endDate: 'May 23' },
    { name: 'NXRS', host: 'OROC', location: 'Brothers, Oregon', organizations: ['Tripoli', 'NAR'], startDate: 'June 25', endDate: 'June 27' }
    // { name: 'Summer Skies', startDate: 'July 23', endDate: 'July 25' },
    // { name: 'Sod Blaster (TCR)', startDate: 'Sep 4', endDate: 'Sep 6' },
    // { name: 'Fillible\'s Folly', startDate: 'Sep 17', endDate: 'Sep 19' },
    // { name: 'Rocketober', startDate: 'Oct 15', endDate: 'Oct 17' }
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
        cert.verifiedDate = (new Date()).toISOString();
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

  const perms : iPerms = {};
  Object.values(users).forEach((attendee, i) => {
    if ((attendee.cert?.level ?? -1) >= 2) {
      perms[attendee.id] = (i % 10) < 4;
    }
  });
  await database().ref(RESOURCE).set(perms);
}

async function seedPads(launchId : string) {
  const RESOURCE = `pads/${launchId}`;

  log('Seeding', RESOURCE);

  // Seed attendees
  const ALL : iPad[] = [];
  const GROUPS = [
    'Low-Power',
    'Mid-Power',
    'High Power (West)',
    'High Power (East)',
    'Away Cell',
    'Hilltop'
  ];

  // Seed pads
  for (const group of GROUPS) {
    const padNames = /Low/.test(group)
      ? '123456'.split('')
      : /Mid|High/.test(group) ? '1234'.split('') : ['1'];
    for (const name of padNames) {
      ALL.push({
        name,
        launchId,
        group
      } as iPad);
    }
  }

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

async function seedCards(launchId : string, attendees : iAttendees, pads : iPads) {
  const RESOURCE = `cards/${launchId}`;

  log('Seeding', RESOURCE);

  // Seed attendees
  const ALL : iCard[] = [];
  for (const userId of Object.keys(attendees).slice(0, 10)) {
    const rocket = createRocket();

    const { _motor: motor } = rocket;
    delete rocket._motor;

    ALL.push({
      id: `${SEED_PREFIX}${nanoid().substr(0, 4)}`,
      launchId,
      userId,
      padId: rndItem(Object.keys(pads)),

      firstFlight: Math.random() < 0.2 || DELETE,
      headsUp: Math.random() < 0.2 || DELETE,
      complex: Math.random() < 0.2 || DELETE,
      notes: 'Randomly generated flight card',

      rocket,
      motor
    } as iCard);
  }

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
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

    for (const launchId of Object.keys(launches)) {
      const attendees = await seedAttendees(launchId, users);

      await seedOfficers(launchId, attendees);

      const pads = await seedPads(launchId);
      await seedCards(launchId, attendees, pads);
    }

    await Promise.all(Object.keys(launches).map(seedPads));
  } catch (err) {
    log(err);
  } finally {
    log('-- fin --');
    seeding = false;
  }
}

async function testDB() {
  const user = auth().currentUser;
  console.log(user);
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
    testAccess('officers/testLaunch/testUser/rso'),
    testAccess('officers/testLaunch/testUser/lco'),
    testAccess(`officers/testLaunch/${uid}/host`),
    testAccess(`officers/testLaunch/${uid}/rso`),
    '---',
    testAccess('cards'),
    testAccess('cards/testLaunch'),
    testAccess('cards/testLaunch/testCard')
  ]).then(results => results.forEach(v => log(v)));
}

export default function Admin() {
  const [, setLogLength] = useState(_log.length);

  // Trigger re-render when log changes
  _log.onLog = () => setLogLength(_log.length);

  return <>
    <div className='deck'>
      <Button variant='warning' onClick={seedDB} >Seed DB</Button>
      <Button variant='warning' onClick={testDB} >Test Access</Button>
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
