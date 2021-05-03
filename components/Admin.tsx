import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { database, DELETE } from '../firebase';
import { iCard, iCert, iLaunch, iLaunchs, iLaunchUser, iLaunchUsers, iPad, iPads, iPerm, iPerms, iUser, iUsers } from '../types';
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
  console.log(...args);
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

  const ALL : iUser[] = NAMES.slice(0, 100).map((name, i) => {
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

async function seedLaunchUsers(launchId : string, users : iUsers) : Promise<iLaunchUsers> {
  const RESOURCE = `launchUsers/${launchId}`;

  log('Seeding', RESOURCE);

  const LAUNCH_USERS = Object.values(users).slice(0, 20);

  // Seed launchUsers
  const ALL : iLaunchUser[] = LAUNCH_USERS.map(user => {
    const cert = {
      level: rndItem([0, 0, 1, 1, 1, 2, 2, 2, 3])
    } as iCert;

    if (cert.level) {
      cert.type = rndItem(['tra', 'nar']);
      cert.number = (3000 + rnd(15000));
      cert.expires = (new Date(Date.now() + rnd(365 * 24 * 3600e3))).toLocaleDateString();
      if (Math.random() < 0.3) {
        cert.verifiedId = rndItem(LAUNCH_USERS).id;
        cert.verifiedDate = (new Date()).toISOString();
      }
    }

    return {
      ...user,
      cert

      // Coords around Brothers, OR
      // lat: 43.7954 + Math.random() * 0.0072,
      // lon: -120.6535 + Math.random() * 0.0109
    } as iLaunchUser;
  });

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

async function seedPermissions(launchId : string, users : iLaunchUsers) {
  const RESOURCE = `launchPerms/${launchId}`;

  log('Seeding', RESOURCE);

  const perms : iPerms = {};
  Object.values(users).forEach((launchUser, i) => {
    const perm : iPerm = perms[launchUser.id] = {};
    if ((launchUser.cert?.level ?? -1) >= 2) {
      if (i % 10 < 4) perm.lco = Math.random() < 0.5;
      if (i % 5 < 1) perm.rso = Math.random() < 0.5;
    }
  });
  await database().ref(RESOURCE).set(perms);
}

async function seedPads(launchId : string) {
  const RESOURCE = `pads/${launchId}`;

  log('Seeding', RESOURCE);

  // Seed launchUsers
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

async function seedCards(launchId : string, launchUsers : iLaunchUsers, pads : iPads) {
  const RESOURCE = `cards/${launchId}`;

  log('Seeding', RESOURCE);

  // Seed launchUsers
  const ALL : iCard[] = [];
  for (const userId of Object.keys(launchUsers).slice(0, 10)) {
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
    await Promise.all([
      'users',
      'launches',
      'launchUsers',
      'launchPerms',
      'pads',
      'cards'
    ].map(purge));

    const [users, launches] = await Promise.all([
      seedUsers(),
      seedLaunches()
    ]);

    for (const launchId of Object.keys(launches)) {
      const launchUsers = await seedLaunchUsers(launchId, users);

      await seedPermissions(launchId, launchUsers);

      const pads = await seedPads(launchId);
      await seedCards(launchId, launchUsers, pads);
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
  log('Starting test');

  console.log('USERS', await (await database().ref('/users').get()).val());
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
