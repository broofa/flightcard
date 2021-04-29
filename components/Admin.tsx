import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { iUser, iLaunchUser, iCard, iPad, iFlight, iUsers, iLaunchs, iLaunchUsers, iPads, iPerm, iPerms, iLaunch } from '../types';
import { NAMES, createRocket, rnd, rndItem } from './mock_data';
import { database } from '../firebase';

const SEED_PREFIX = 'fc_';
let seedId = 0;
function genId(path) {
  path = path.replace(/\/.*/, '').toLowerCase().replace(/(?:es|s)$/, '');
  return `${SEED_PREFIX}${path}${(seedId++).toString().padStart(3, '0')}`;
}

// "Hey, some sort of logging would be nice, but I don't want to think too hard about it...""
const _log : any = [];
function log(...args) {
  args = [...args];
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

  const ALL : iUser[] = NAMES.slice(0, 25).map((name, i) => {
    const user = {
      name,
      id: genId('user')
    };

    if (i % 10 < 8) {
      Object.assign(user, {
        certLevel: rndItem([1, 1, 1, 2, 2, 2, 3]),
        certType: rndItem(['tra', 'nar']),
        certNumber: (3000 + rnd(15000)),
        certExpires: (new Date(Date.now() + rnd(365 * 24 * 3600e3))).toLocaleDateString()
      });
    }

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
  ].map(l => ({ host: 'OROC', location: 'Brothers, Oregon', ...l } as iLaunch));

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

async function seedLaunchUsers(launchId : string, users : iUsers) : Promise<iLaunchUsers> {
  const RESOURCE = `launchUsers/${launchId}`;

  log('Seeding', RESOURCE);

  // Seed launchUsers
  const ALL : iLaunchUser[] = Object.values(users).slice(0, 10).map(u => ({
    ...u,
    verified: rndItem([true, true, true, false]),
    waiverSignedDate: (new Date()).toISOString(),

    // Coords around Brothers, OR
    lat: 43.7954 + Math.random() * 0.0072,
    lon: -120.6535 + Math.random() * 0.0109
  } as iLaunchUser));

  const entries = await Promise.all(
    ALL.map(async l => rtPush(RESOURCE, l).then(id => [id, l])));

  return Object.fromEntries(entries);
}

async function seedPermissions(launchId : string, users : iLaunchUsers) {
  const RESOURCE = `launchPerms/${launchId}`;

  log('Seeding', RESOURCE);

  const perms : iPerms = {};
  Object.values(users).forEach((lu, i) => {
    const perm : iPerm = perms[lu.id] = {};
    if ((lu.certLevel ?? -1) >= 2) {
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
  for (const lu of Object.values(launchUsers).slice(0, 10)) {
    const { id } = lu;

    const rocket = createRocket();
    const { motor, _mImpulse } = rocket;
    delete rocket._mImpulse;
    delete rocket._mBurn;
    delete rocket._mThrust;

    const flight = {
      firstFlight: rndItem([true, false]),
      headsUp: rndItem([true, false]),
      impulse: _mImpulse,
      notes: 'Randomly generated flight card'
    } as iFlight;

    if (motor) flight.motor = motor;

    const padId = rndItem(Object.keys(pads));
    ALL.push({
      launchId,
      userId: id,
      padId,
      rocket,
      flight
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

export default function Admin() {
  const [, setLogLength] = useState(_log.length);

  // Trigger re-render when log changes
  _log.onLog = () => setLogLength(_log.length);

  return <>
    <Button onClick={seedDB}>Seed DB</Button>
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
