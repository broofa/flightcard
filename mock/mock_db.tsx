import { createRocket, NAMES, rnd, rndItem } from './mock_data';
import {
  CardStatus,
  CertOrg,
  iAttendees,
  iCard,
  iCards,
  iCerts,
  iLaunches,
  iMotor,
  iOfficers,
  iPads,
  iRocket,
  iUsers,
} from '/types';

export const MOCK_ID_PREFIX = 'FC_';

// TODO: Figure out how to avoid having to redefine this here from /rt to avoid circular dependency
export const DELETE = null as unknown as undefined;

const LAUNCH_NAMES = [
  // 'AP Showers',
  // 'Spring Thunder',
  // 'NXRS',
  // 'Summer Skies',
  // 'Sod Blaster (TCR)',
  // 'Rocketober',
  // "Fillible's Folly",
  'Arbuckle Classic',
  'Tsiolkovsky Jamboree',
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

function genIdReset() {
  seedIds = {};
}

export type DBRoot = {
  attendees: Record<string, iAttendees>;
  cards: Record<string, iCards>;
  launches: iLaunches;
  officers: Record<string, iOfficers>;
  pads: Record<string, iPads>;
  users: iUsers;
};

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
  for (const name of names) {
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
      name,
      ...host,
      startDate: startDate.toISOString().replace(/T.*/, ''),
      endDate: endDate.toISOString().replace(/T.*/, ''),
    };
  }
}

function mockCerts(name = '') {
  const [firstName, lastName] = (name ?? '').split(' ');

  const certs: iCerts = {};
  for (const organization of [CertOrg.NAR, CertOrg.TRA]) {
    if (!rnd(2)) continue;

    certs[organization] = {
      firstName,
      lastName,
      level: rndItem([0, 0, 1, 1, 1, 2, 2, 2, 3]),
      organization,
      memberId: 3000 + rnd(15000),
      expires: Date.now() + rnd(365 * 24 * 3600e3),
    };
  }

  return Object.keys(certs).length ? certs : DELETE;
}

function mockAttendees(root: DBRoot, launchId?: string, currenUserId?: string) {
  if (!launchId) {
    for (const launchId of Object.keys(root.launches)) {
      mockAttendees(root, launchId);
    }
    return;
  }

  if (!(launchId in root.launches)) throw Error(`No launch ${launchId}`);

  root.attendees[launchId] = {};

  if (currenUserId) {
    root.attendees[launchId][currenUserId] = {
      id: currenUserId,
      name: 'You!',
      waiverTime: Date.now(),
    };
  }

  for (const user of Object.values(root.users).slice(0, 20)) {
    const attendee = {
      ...user,
      certs: mockCerts(user.name),
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

function mockOfficers(root: DBRoot, launchId?: string, currenUserId?: string) {
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
  if (currenUserId) {
    root.officers[launchId][currenUserId] = true;
  }
  for (const attendee of attendees) {
    if (!attendee.certs) continue;
    for (const cert of Object.values(attendee.certs)) {
      if (cert.level <= 0 || Math.random() < 0.5) continue;

      cert.verifiedId = rndItem(Object.keys(root.officers[launchId]));
      cert.verifiedTime = Date.now() - rnd(365 * 24 * 3600e3);
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

export function createMockData(currenUserId?: string) {
  const root = mockRoot();

  genIdReset();

  mockUsers(root);
  mockLaunches(root);
  mockAttendees(root, undefined, currenUserId);
  mockOfficers(root, undefined,currenUserId);
  mockPads(root);
  mockCards(root);

  return root;
}
