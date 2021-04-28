import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { iUser, iLaunch, iLaunchUser, tRole, iCard, iPad, iFlight } from '../types';
import { NAMES, createRocket, rnd, rndItem } from './mock_data';
import { database } from '../firebase';

const SEED_PREFIX = 'fc_';

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
let seedId = 0;
export async function rtPush<T>(path : string, state : T) : Promise<string> {
  const resource = path.replace(/\/.*/, '').toLowerCase().replace(/(?:es|s)$/, '');
  const n = (seedId++).toString().padStart(3, '0');
  const key = `${SEED_PREFIX}${resource}${n}`;
  await database().ref(`${path}/${key}`).set(state);
  return key;
}

async function seedUsers() : Promise<Record<string, iUser>> {
  const RESOURCE = 'users';
  let all : Record<string, iUser> = (await database().ref(RESOURCE).get()).val();
  if (!all) {
    log('Seeding', RESOURCE);
    all = {};

    const ALL : iUser[] = NAMES.slice(0, 25).map(name => {
      const user = {
        name,

        // Coords around Brothers, OR
        lat: 43.7954 + Math.random() * 0.0072,
        lon: -120.6535 + Math.random() * 0.0109
      };

      if (Math.random() < 0.8) {
        Object.assign(user, {
          certLevel: rndItem([1, 1, 1, 2, 2, 2, 3]),
          certType: rndItem(['tra', 'nar']),
          certNumber: (3000 + rnd(15000)),
          certExpires: (new Date(Date.now() + rnd(365 * 24 * 3600e3))).toLocaleDateString()
        });
      }

      return user as iUser;
    });

    log(RESOURCE, ALL);

    await Promise.all(
      ALL.map(async l => rtPush(RESOURCE, l).then(id => all[id] = l as iUser)));
  }

  return all;
}

async function seedLaunches() : Promise<Record<string, iLaunch>> {
  const RESOURCE = 'launches';
  let all : Record<string, iLaunch> = (await database().ref(RESOURCE).get()).val();
  if (!all) {
    log('Seeding', RESOURCE);
    all = {};

    const ALL = [
      { name: 'AP Showers', startDate: 'April 23', endDate: 'April 25' },
      { name: 'Spring Thunder', startDate: 'May 21', endDate: 'May 23' },
      { name: 'NXRS', host: 'OROC', location: 'Brothers, Oregon', organizations: ['Tripoli', 'NAR'], startDate: 'June 25', endDate: 'June 27' }
      // { name: 'Summer Skies', startDate: 'July 23', endDate: 'July 25' },
      // { name: 'Sod Blaster (TCR)', startDate: 'Sep 4', endDate: 'Sep 6' },
      // { name: 'Fillible\'s Folly', startDate: 'Sep 17', endDate: 'Sep 19' },
      // { name: 'Rocketober', startDate: 'Oct 15', endDate: 'Oct 17' }
    ].map(l => ({ host: 'OROC', location: 'Brothers, Oregon', ...l }));

    log(RESOURCE, ALL);

    await Promise.all(
      ALL.map(async l => rtPush(RESOURCE, l).then(id => all[id] = l as iLaunch)));
  }

  return all;
}

async function seedLaunchUsers(launchId : string, users : Record<string, iUser>) {
  const RESOURCE = `launchUsers/${launchId}`;
  let all : Record<string, iLaunchUser> = (await database().ref(RESOURCE).get()).val();

  if (!all) {
    log('Seeding', RESOURCE);
    all = {};

    // Seed launchUsers
    const ALL : iLaunchUser[] = [];
    for (const [userId, user] of Object.entries(users).slice(0, 10)) {
      const permissions : tRole[] = [];
      if (user.certLevel) permissions.push('flier');
      if ((user.certLevel ?? -1) >= 2) {
        if (Math.random() < 0.4) permissions.push('lco');
        if (Math.random() < 0.2) permissions.push('rso');
      }

      ALL.push({
        launchId,
        userId,
        verified: rndItem([true, true, true, false]),
        permissions,
        waiverSignedDate: (new Date()).toISOString()
      });
    }

    ALL.filter(u => u.permissions?.includes('lco'))
      .slice(0, 2)
      .forEach(u => u.role = 'lco');

    ALL.filter(u => u.permissions?.includes('rso'))
      .slice(0, 2)
      .forEach(u => u.role = 'rso');

    log(RESOURCE, ALL);

    await Promise.all(
      ALL.map(async l => rtPush(RESOURCE, l).then(id => all[id] = l as iLaunchUser)));
  }

  return all;
}

async function seedPads(launchId : string) {
  const RESOURCE = `pads/${launchId}`;
  let all : Record<string, iPad> = (await database().ref(RESOURCE).get()).val();

  if (!all) {
    log('Seeding', RESOURCE);
    all = {};

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
        });
      }
    }

    log(RESOURCE, all);

    await Promise.all(
      ALL.map(async l => rtPush(RESOURCE, l).then(id => all[id] = l as iPad)));
  }

  return all;
}

async function seedCards(
  launchId : string,
  launchUsers : Record<string, iLaunchUser>,
  pads : Record<string, iPad>
) {
  const RESOURCE = `cards/${launchId}`;
  let all : Record<string, iCard> = (await database().ref(RESOURCE).get()).val();

  if (!all) {
    log('Seeding', RESOURCE);
    all = {};

    // Seed launchUsers
    const ALL : iCard[] = [];
    for (const { userId } of Object.values(launchUsers).slice(0, 10)) {
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
        userId,
        padId,
        rocket,
        flight
      });
    }

    log(RESOURCE, all);

    await Promise.all(
      ALL.map(async l => rtPush(RESOURCE, l).then(id => all[id] = l as iCard)));
  }

  return all;
}

async function purge(path) {
  log('Purging', path);
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

  try {
    await Promise.all(['users', 'launches', 'launchUsers', 'pads', 'cards'].map(purge));

    const [users, launches] = await Promise.all([
      seedUsers(),
      seedLaunches()
    ]);

    for (const launchId of Object.keys(launches)) {
      const launchUsers = await seedLaunchUsers(launchId, users);
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
