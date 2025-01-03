/**
 * Generate a robust set of mock data for testing and development.
 *
 * NOTE: IDEMPOTENT!
 */

import {
  type AttendeeModel,
  type CertModel,
  CertOrg,
  type FlightModel,
  FlightStatus,
  type LaunchModel,
  type PadModel,
  ROCKET_COLORS,
  type RocketModel,
  type UserModel,
  UserUnits,
  createAttendee,
  createCert,
  createFlight,
  createLaunch,
  createPad,
  createRocket,
  createUser,
} from '@flightcard/models';
import {
  MOCK_LAUNCH_NAMES,
  MOCK_ROCKET_NAMES,
  MOCK_USER_NAMES,
} from './mock-util';

type Mocks = {
  attendees: AttendeeModel[];
  certs: CertModel[];
  flights: FlightModel[];
  launches: LaunchModel[];
  pads: PadModel[];
  rockets: RocketModel[];
  users: UserModel[];
};

const STATUSES = Object.values(FlightStatus);

export function getMockModels() {
  const gen = new MockGenerator();
  gen.generate();
  return gen.mocks;
}

// Samll, high-quality, seedable PRNG
// REF https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0; // "">>> 0" Ensures non-negative
  };
}

class MockGenerator {
  #ids: Record<string, number> = {};

  // Seedable RNG here for repeatable results
  #rng = mulberry32(0x6d086bf3); // Seed value is arbitrary

  mocks: Mocks = {
    attendees: [],
    certs: [],
    flights: [],
    launches: [],
    pads: [],
    rockets: [],
    users: [],
  };

  #mockCounter(prefix: string) {
    this.#ids[prefix] = (this.#ids[prefix] || 0) + 1;
    return this.#ids[prefix];
  }

  #mockID(prefix: string): string {
    return `mock-${prefix}-${this.#mockCounter(prefix)}`;
  }

  #rndInt(max: number) {
    return this.#rng() % max;
  }

  #rndBool(probability = 0.5) {
    return this.#rng() / 0xffffffff < probability;
  }

  #rndItem<T>(arr: T[]): T | undefined {
    return arr[this.#rndInt(arr.length)];
  }

  #rndItems<T>(arr: T[], n: number) {
    const items = [...arr];
    items.sort(() => (this.#rndBool() ? -1 : 1));
    return items.slice(0, n);
  }

  generate() {
    // Mock launches
    for (let i = 0; i < MOCK_LAUNCH_NAMES.length; i++) {
      const launchName = MOCK_LAUNCH_NAMES[i];

      const nPads = Math.floor(i ** 2 * 3);
      const nAttendees = Math.floor(i ** 2.5 * 6);

      this.mockLaunch(launchName, nPads, nAttendees);
    }
  }

  mockLaunch(name: string, nPads: number, nAttendees: number) {
    const prior = this.mocks.launches.find((m) => m.name === name);
    if (prior) {
      return prior;
    }

    const launch = createLaunch({
      launchID: this.#mockID('launch'),
      name,
    });

    this.mocks.launches.push(launch);

    // Mock pads
    for (let padNum = 0; padNum < nPads; padNum++) {
      const group = padNum > 5 ? `Group ${Math.floor(padNum / 4)}` : undefined;
      this.mockPad(launch, `Pad ${padNum + 1}`, group);
    }

    const attendeeNames = this.#rndItems(MOCK_USER_NAMES, nAttendees);
    const officers = [];

    // Mock attendees
    for (const attendeeName of attendeeNames) {
      const user = this.mockUser(attendeeName);
      const attendee = this.mockAttendee(user, launch);

      const registeredBy = this.#rndBool()
        ? this.#rndItem(officers)
        : undefined;

      const isOfficer = officers.length < Math.sqrt(nAttendees) / 2;
      if (isOfficer) {
        officers.push(attendee);
        attendee.isOfficer = isOfficer;
      }

      if (registeredBy) {
        attendee.registeredByID = registeredBy?.attendeeID;
      }

      const userRockets = this.mocks.rockets.filter(
        (r) => r.userID === user.userID
      );

      // Mock flights
      for (let j = 0; j < userRockets.length; j++) {
        const rocket = userRockets[j];
        this.mockFlight(launch, user, rocket);
      }
    }

    return launch;
  }

  mockFlight(
    { launchID }: LaunchModel,
    { userID }: UserModel,
    { rocketID }: RocketModel
  ) {
    const flight = createFlight({
      flightID: this.#mockID('flight'),
      launchID,
      rocketID,
      userID,
      status: this.#rndItem(STATUSES),
    });
    this.mocks.flights.push(flight);
    return flight;
  }

  mockPad({ launchID }: LaunchModel, name: string, group?: string) {
    const prior = this.mocks.pads.find(
      (m) => m.name === name && m.launchID === launchID
    );
    if (prior) {
      return prior;
    }

    const pad = createPad({
      padID: this.#mockID('pad'),
      launchID,
      name,
      group,
    });
    this.mocks.pads.push(pad);
    return pad;
  }

  mockUser(name: string) {
    const [firstName, lastName] = name.split(' ');
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    const prior = this.mocks.users.find((m) => m.email === email);
    if (prior) {
      return prior;
    }

    const user = createUser({
      userID: this.#mockID('user'),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      units: UserUnits.US,
      firstName,
      lastName,
    });

    // Mock certs
    if (this.#rndBool(0.5)) {
      user.narID = this.mockCert(user, CertOrg.NAR).memberId;
    }
    if (this.#rndBool(0.5)) {
      user.traID = this.mockCert(user, CertOrg.TRA).memberId;
    }

    // Mock rockets
    const nRockets = this.#rndInt(8);
    for (let i = 0; i < nRockets; i++) {
      this.mockRocket(user);
    }

    this.mocks.users.push(user);

    return user;
  }

  mockRocket({ userID }: UserModel) {
    const name = this.#rndItem(MOCK_ROCKET_NAMES);
    const rocket = createRocket({
      rocketID: this.#mockID('rocket'),
      userID,
      name,
      extra: {
        description: `A very nice ${this.#rndItems(ROCKET_COLORS, this.#rndInt(3) + 1)} rocket`,
      },
    });

    this.mocks.rockets.push(rocket);

    return rocket;
  }

  mockCert({ firstName = '', lastName = '' }: UserModel, org: CertOrg) {
    const prior = this.mocks.certs.find(
      (m) =>
        m.firstName === firstName &&
        m.lastName === lastName &&
        m.organization === org
    );
    if (prior) {
      console.log('PRIOR!', prior);
      return prior;
    }

    const cert = createCert({
      certID: this.#mockID('cert'),
      expiresAt: Date.now() + 60 * 60 * 24 * 1000,
      firstName,
      lastName,
      level: 1,
      memberId: this.#mockCounter(org + 'ID'),
      organization: org,
    });
    this.mocks.certs.push(cert);

    return cert;
  }

  mockAttendee({ userID }: UserModel, { launchID }: LaunchModel) {
    const prior = this.mocks.attendees.find(
      (m) => m.userID === userID && m.launchID === launchID
    );
    if (prior) {
      return prior;
    }

    const attendee = createAttendee({
      attendeeID: this.#mockID('attendee'),
      userID,
      launchID,
      tosAcceptedAt: 1735936396671,
    });
    this.mocks.attendees.push(attendee);
    return attendee;
  }
}
