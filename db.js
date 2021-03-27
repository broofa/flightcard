import Dexie from 'dexie';
import { rnd } from './mock_data/index.js';
import USER_NAMES from './mock_data/names.js';

function assignIds(target) {
  return function(ids) {
    ids.forEach((id, i) => target[i].id = id);
  };
}

const db = new Dexie('flightcard');

// Define DB schema
db.version(1).stores({
  cards: '++id, [launchId+userId],  userId',
  launches: '++id',
  launchUsers: '[launchId+userId]',
  pads: '++id, rackId',
  racks: '++id, launchId',
  sessions: '&id',
  users: '++id, &email, launchId, role'
});

db.on('populate', async () => {
  // Seed users

  const users = (new Array(100)).fill(0).map((v, i) => {
    const name = USER_NAMES.splice(rnd(USER_NAMES.length), 1)[0];
    const certLevel = rnd([undefined, undefined, 1, 1, 1, 2, 2, 2, 3]);
    const certType = certLevel && rnd(['tra', 'nar']);
    const certNumber = certLevel && (3000 + rnd(15000));
    const certExpires = certLevel && (new Date(Date.now() + rnd(365 * 24 * 3600e3))).toLocaleDateString();

    return {
      name,
      certLevel,
      certType,
      certNumber,
      certExpires
    };
  });

  db.users.bulkAdd(users, { allKeys: true })
    .then(assignIds(users));

  // Seed launches
  const launches = [
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
    };
  });
  await db.launches.bulkAdd(launches, { allKeys: true }).then(assignIds(launches));

  // Seed launchUsers
  const launchUsers = [];
  for (const launch of launches) {
    for (const user of users) {
      if (Math.random() < 0.3) continue;

      const permissions = [];
      if (user.certLevel) permissions.push('flier');
      if (user.certLevel >= 2) {
        if (Math.random() > 0.5) permissions.push('lco');
        if (Math.random() > 0.5) permissions.push('rso');
      }

      launchUsers.push({
        launchId: launch.id,
        userId: user.id,
        permissions,
        agreedAt: (new Date()).toISOString()
      });
    }
  }

  launchUsers.filter(u => u.permissions.includes('lco'))
    .slice(0, 2)
    .forEach(u => u.role = 'lco');

  launchUsers.filter(u => u.permissions.includes('rso'))
    .slice(0, 2)
    .forEach(u => u.role = 'rso');

  await db.launchUsers.bulkAdd(launchUsers);

  // Seed racks
  const racks = [
    { name: 'Rack #1, Low-Power' },
    { name: 'Rack #2, Mid-Power' },
    { name: 'Rack #3, High Power (West)' },
    { name: 'Rack #4, High Power (East)' },
    { name: 'Rack #5, Away pad' },
    { name: 'Rack #6, Hilltop' }
  ];
  racks.forEach(rack => rack.launchId = launches[0].id);
  await db.racks.bulkAdd(racks, { allKeys: true })
    .then(assignIds(racks));

  // Seed pads
  const pads = [];
  for (const rack of racks) {
    const rackNum = parseInt(/(\d)/.test(rack.name) && RegExp.$1);
    for (const padName of rackNum <= 4 ? ['1', '2', '3', '4'] : ['1']) {
      pads.push({ name: padName, rackId: rack.id });
    }
  }
  await db.pads.bulkAdd(pads, { allKeys: true })
    .then(assignIds(pads));
});

db.open();
window.db = db;
export default db;
