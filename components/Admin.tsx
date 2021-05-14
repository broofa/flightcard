import React, { useContext, useState } from 'react';
import { Button } from 'react-bootstrap';
import { auth, database, DELETE } from '../firebase';
import { iAttendee, iAttendees, iCard, iCert, iLaunch, iLaunchs, iMotor, iPad, iPads, iPerms, iRack, iRocket, iUser, iUsers } from '../types';
import { unitParse } from '../util/units';
import { AppContext } from './App';
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

async function seedOfficers(launchId : string, users : iAttendees, currentUser : iUser) {
  const RESOURCE = `officers/${launchId}`;

  // This should never happen
  if (!currentUser) throw Error('No current user(?!?)');

  log('Seeding', RESOURCE);

  // Make sure current owner is an officer
  const officers : iPerms = { [currentUser.id]: true };

  Object.values(users).forEach((attendee, i) => {
    if ((attendee.cert?.level ?? -1) >= 2 && (i % 10) < 4) {
      officers[attendee.id] = true;
    }
  });
  await database().ref(RESOURCE).set(officers);
}

async function seedPads(launchId : string) {
  const RESOURCE = 'pads';

  log('Seeding', RESOURCE);

  // Seed pads
  const ALL : iPad[] = [];
  const RACKS = [
    'Low-Power',
    'Mid-Power',
    'High Power (West)',
    'High Power (East)',
    'Away Cell',
    'Hilltop'
  ];

  const racks : iRack[] = [];

  // Seed pads
  for (const rackName of RACKS) {
    const padNames = /Low|Mid|High/.test(rackName) ? '1234'.split('') : ['1'];

    const padIds : string[] = [];
    for (const name of padNames) {
      const id = genId('pad');
      padIds.push(id);
      ALL.push({
        id,
        name,
        launchId,
        group: rackName
      } as iPad);
    }

    racks.push({ name: rackName, padIds });
  }

  // Configure launch racks
  await database().ref(`launches/${launchId}`).update({ racks });

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
      await database().ref(`pads/${padId}`).update({ cardId: id });

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
async function seedDB(context) {
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

      await seedOfficers(launchId, attendees, context.currentUser);

      const pads = await seedPads(launchId);

      await seedCards(launchId, attendees, pads);
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

  const VALS = {
    // unitless
    '-1.23': -1.23,

    // Standard MKS units
    '1m': 1,
    '1kg': 1,
    '1n': 1,
    '1n-sec': 1,

    // test lengths
    '1ft': 0.3048,
    '1 ft': 0.3048,
    '1 FT': 0.3048,
    '1\'': 0.3048,
    '1in': 0.0254,
    '1"': 0.0254,
    '1ft1in': 0.3302,
    '1 ft 1 in': 0.3302,
    '1ft 1in': 0.3302,
    '1cm': 0.01,
    '1mm': 0.001,

    // test mass
    '1lb': 0.453592,
    '1oz': 0.0283495,
    '1lb1oz': 0.4819415,
    '1gm': 0.001,

    // test impulse
    '1lbf': 4.44822,

    // test force
    '1lbf-s': 4.44822,
    '1lbf-sec': 4.44822
  };

  for (const [str, expected] of Object.entries(VALS)) {
    const actual = unitParse(str);
    if (actual === expected) {
      log('\u2705', str, '->', expected);
    } else {
      log('\u274c', str, '->', String(actual), `(expected ${expected})`);
    }
  }
}

export default function Admin() {
  const [, setLogLength] = useState(_log.length);
  const context = useContext(AppContext);

  // Trigger re-render when log changes
  _log.onLog = () => setLogLength(_log.length);

  return <>
    <div className='deck'>
      <Button variant='warning' onClick={() => seedDB(context)} >Seed DB</Button>
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
