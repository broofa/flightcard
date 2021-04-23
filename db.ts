import Dexie from 'dexie';
import { rnd, rndItem, createRocket } from './mock_data/index';
import USER_NAMES from './mock_data/names';

export type tRole = 'flier' | 'lco' | 'rso';

export interface iUser {
  id ?: number;
  launchUser ?: iLaunchUser;
  name : string;
  email : string | undefined;
  certLevel ?: number;
  certType ?: string;
  certNumber ?: number;
  certExpires ?: string;
  lat ?: number;
  lon ?: number;
}

export interface iLaunch {
  id : number;
  name : string;
  location : string;
  host : string;
  startDate : string;
  endDate : string;
  rangeOpen : boolean;
}

export interface iLaunchUser {
  launchId : number;
  userId : number;
  agreedAt : string;
  verified : boolean;
  permissions : tRole[];
  role ?: tRole | undefined;
}

export interface iRocket {
  id : number,
  name : string,
  manufacturer : string,
  color : string,
  diameter : number,
  length : number,
  weight : number,
  motor ?: string,
  _mImpulse ?: number,
  _mBurn ?: number,
  _mThrust ?: number
}

export interface iFlight {
  firstFlight : boolean,
  headsUp : boolean,
  motor : string,
  impulse ?: number,
  notes ?: string
}

export interface iCard {
  id ?: number;
  launchId : number;
  userId : number;
  lcoId ?: number;
  rsoId ?: number;
  padId ?: number;
  rocket : iRocket;
  flight : iFlight;
  _user ?: iUser, // Cached in Launch.tsx
}
export interface iSession {
  id : string;
  userId : number;
}
export interface iRack {
  id ?: number;
  name : string;
  launchId : number;
}
export interface iPad {
  id ?: number;
  name : string;
  launchId : number;
  rackId : number;
}

function assignIds(target : ({id ?: string | number}[])) {
  return function(ids : (string|number)[]) {
    ids.forEach((id, i) => target[i].id = id);
  };
}

class FlightCardDB extends Dexie {
  cards : Dexie.Table<iCard, number>;
  launches : Dexie.Table<iLaunch, number>;
  launchUsers : Dexie.Table<iLaunchUser, number>;
  pads : Dexie.Table<iPad, number>;
  racks : Dexie.Table<iRack, number>;
  sessions : Dexie.Table<iSession, number>;
  users : Dexie.Table<iUser, number>;

  // These are declared in dexie.d.ts but eslint is complaining so declaring here
  on : any;
  open : any;
  version : any;

  constructor(name : string) {
    super(name);

    this.version(1).stores({
      cards: '++id, [launchId+userId], userId',
      launches: '++id',
      launchUsers: '[launchId+userId]',
      pads: '++id, launchId',
      racks: '++id, launchId',
      sessions: '&id',
      users: '++id, &email, launchId'
    });

    this.cards = this.table('cards');
    this.launches = this.table('launches');
    this.launchUsers = this.table('launchUsers');
    this.pads = this.table('pads');
    this.racks = this.table('racks');
    this.sessions = this.table('sessions');
    this.users = this.table('users');
  }
}

const db = new FlightCardDB('flightcard');

db.on('populate', async () => {
  // Seed users

  const users : iUser[] = (new Array(40)).fill(0).map(() => {
    const name = USER_NAMES.splice(50, 1)[0];
    const certLevel = rndItem([undefined, undefined, 1, 1, 1, 2, 2, 2, 3]);
    const certType = certLevel && rndItem(['tra', 'nar']);
    const certNumber = certLevel && (3000 + rnd(15000));
    const certExpires = certLevel && (new Date(Date.now() + rnd(365 * 24 * 3600e3))).toLocaleDateString();
    const lat = 43.7954 + Math.random() * 0.0072;
    const lon = -120.6535 + Math.random() * 0.0109;

    return {
      name,
      certLevel,
      certType,
      certNumber,
      certExpires,
      lat,
      lon
    } as iUser;
  });

  db.users.bulkAdd(users, { allKeys: true })
    .then(assignIds(users));

  // Seed launches
  const LAUNCHES : iLaunch[] = [
    {
      name: 'AP Showers',
      startDate: 'April 23',
      endDate: 'April 25'
    },
    {
      name: 'Spring Thunder',
      startDate: 'May 21',
      endDate: 'May 23'
    }
    // {
    //   name: 'NXRS',
    //   host: 'OROC',
    //   location: 'Brothers, Oregon',
    //   organizations: ['Tripoli', 'NAR'],
    //   startDate: 'June 25',
    //   endDate: 'June 27'
    // },
    // {
    //   name: 'Summer Skies',
    //   startDate: 'July 23',
    //   endDate: 'July 25'
    // },
    // {
    //   name: 'Sod Blaster (TCR)',
    //   startDate: 'Sep 4',
    //   endDate: 'Sep 6'
    // },
    // {
    //   name: 'Fillible\'s Folly',
    //   startDate: 'Sep 17',
    //   endDate: 'Sep 19'
    // },
    // {
    //   name: 'Rocketober',
    //   startDate: 'Oct 15',
    //   endDate: 'Oct 17'
    // }
  ].map(l => {
    return {
      host: 'OROC',
      location: 'Brothers, Oregon',
      ...l
    } as iLaunch;
  });
  await db.launches.bulkAdd(LAUNCHES, { allKeys: true }).then(assignIds(LAUNCHES));

  // Seed launchUsers
  const launchUsers : iLaunchUser[] = [];
  const launch = LAUNCHES[0] as iLaunch;
  for (const user of users) {
    if (Math.random() < 0.4) continue;

    const permissions : tRole[] = [];
    if (user.certLevel) permissions.push('flier');
    if ((user.certLevel ?? -1) >= 2) {
      if (Math.random() < 0.4) permissions.push('lco');
      if (Math.random() < 0.2) permissions.push('rso');
    }

    launchUsers.push({
      launchId: launch.id,
      userId: user.id as number,
      verified: rndItem([true, true, true, false]),
      permissions,
      agreedAt: (new Date()).toISOString()
    });
  }

  launchUsers.filter(u => u.permissions?.includes('lco'))
    .slice(0, 2)
    .forEach(u => u.role = 'lco');

  launchUsers.filter(u => u.permissions?.includes('rso'))
    .slice(0, 2)
    .forEach(u => u.role = 'rso');

  await db.launchUsers.bulkAdd(launchUsers);

  // Seed racks
  const RACKS = [
    'Low-Power',
    'Mid-Power',
    'High Power (West)',
    'High Power (East)',
    'Away Cell',
    'Hilltop'
  ];
  const pads : iPad[] = [];
  const racks = RACKS.map(name => ({
    name,
    launchId: LAUNCHES[0].id
  } as iRack));

  await db.racks.bulkAdd(racks, { allKeys: true })
    .then(assignIds(racks));

  // Seed pads
  for (const rack of racks) {
    const padNames = /Low/.test(rack.name)
      ? '123456'.split('')
      : /Mid|High/.test(rack.name) ? '1234'.split('') : ['1'];
    for (const name of padNames) {
      pads.push({
        name,
        launchId: LAUNCHES[0].id,
        rackId: rack.id as number
      });
    }
  }
  await db.pads.bulkAdd(pads, { allKeys: true })
    .then(assignIds(pads));

  // Seed cards
  const cards : iCard[] = launchUsers.slice(0, 10).map(launchUser => {
    const launchId = LAUNCHES[0].id;
    const userId = launchUser.userId;

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

    const pad = rndItem(pads);

    return {
      launchId,
      userId,
      padId: pad.id,
      verified: false,
      rocket,
      flight
    };
  });

  await db.cards.bulkAdd(cards);
});

db.open();
(window as any).db = db; // eslint-disable-line
export default db;
