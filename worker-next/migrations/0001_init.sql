-- Migration number: 0001 	 2024-11-25T00:06:55.699Z
PRAGMA defer_foreign_keys = TRUE;

--
-- ATTENDEES
--
DROP TABLE IF EXISTS attendees;

CREATE TABLE IF NOT EXISTS attendees (
  attendeeID TEXT PRIMARY KEY,
  launchID TEXT NOT NULL,
  userID TEXT NOT NULL,
  registeredByID TEXT,
  isOfficer BOOLEAN NOT NULL DEFAULT FALSE,
  tosAcceptedAt DATETIME,
  -- JSON extra structured fields
  -- * {string} officerRole (registration, flight review, launch control, range safety)
  extra TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (launchID) REFERENCES launches(launchID),
  FOREIGN KEY (userID) REFERENCES users(userID),
  FOREIGN KEY (registeredByID) REFERENCES attendees(attendeeID)
);

CREATE INDEX IF NOT EXISTS attendees_launchID ON attendees (launchID);

CREATE INDEX IF NOT EXISTS attendees_userID ON attendees (userID);

CREATE TRIGGER IF NOT EXISTS attendees_updatedAt
AFTER
UPDATE
  ON attendees FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  attendees
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;

--
-- CERTS
--
DROP TABLE IF EXISTS certs;

CREATE TABLE IF NOT EXISTS certs (
  certID TEXT PRIMARY KEY NOT NULL,
  organization TEXT CHECK(organization IN ('TRA', 'NAR')),
  memberID INTEGER,
  LEVEL INTEGER,
  expiresAt INTEGER,
  firstName TEXT COLLATE NOCASE,
  lastName TEXT COLLATE NOCASE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS certs_organization_memberID ON certs (organization, memberID);

CREATE INDEX IF NOT EXISTS certs_memberID ON certs (memberID);

CREATE INDEX IF NOT EXISTS certs_organization ON certs (organization);

CREATE INDEX IF NOT EXISTS certs_firstName ON certs (firstName);

CREATE INDEX IF NOT EXISTS certs_lastName ON certs (lastName);

CREATE TRIGGER IF NOT EXISTS certs_updatedAt
AFTER
UPDATE
  ON certs FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  certs
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;

--
-- FLIGHTS
--
DROP TABLE IF EXISTS flights;

CREATE TABLE IF NOT EXISTS flights (
  flightID TEXT PRIMARY KEY,
  launchedByUserID TEXT launchID TEXT,
  launchID TEXT NOT NULL,
  padID TEXT,
  rack INTEGER,
  reviewedByUserID TEXT,
  rocketID TEXT NOT NULL,
  userID TEXT createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL CHECK(
    "status" IN (
      'draft',
      'review:pending',
      'review:approved',
      'review:rejected',
      'racked',
      'launched:recycle',
      'launched:inflight',
      'launched:cato',
      'launched:lost',
      'launched:success',
      'launched:recovery failure',
      'launched:ignition failure',
      'launched:shred'
    )
  ),
  -- JSON extra structured fields
  -- * {string} notes
  -- * {boolean} isHeadsUp
  -- * {boolean} isNightFlight
  -- * {boolean} isFirstFlight
  -- * {number 1-3} certFlightLevel
  extra TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (launchedByUserID) REFERENCES users(userID),
  FOREIGN KEY (launchID) REFERENCES launches(launchID),
  FOREIGN KEY (padID) REFERENCES pads(padID),
  FOREIGN KEY (reviewedByUserID) REFERENCES users(userID),
  FOREIGN KEY (rocketID) REFERENCES rockets(rocketID),
  FOREIGN KEY (userID) REFERENCES users(userID)
);

CREATE INDEX IF NOT EXISTS flights_launchedByUserID ON flights (launchedByUserID);

CREATE INDEX IF NOT EXISTS flights_launchID ON flights (launchID);

CREATE INDEX IF NOT EXISTS flights_reviewedByUserID ON flights (reviewedByUserID);

CREATE INDEX IF NOT EXISTS flights_rocketID ON flights (rocketID);

CREATE INDEX IF NOT EXISTS flights_userID ON flights (userID);

CREATE TRIGGER IF NOT EXISTS flights_updatedAt
AFTER
UPDATE
  ON flights FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  flights
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;

--
-- LAUNCHES
--
DROP TABLE IF EXISTS launches;

CREATE TABLE IF NOT EXISTS launches (
  launchID TEXT PRIMARY KEY,
  endTime DATETIME,
  name TEXT COLLATE NOCASE,
  club TEXT COLLATE NOCASE,
  startTime DATETIME,
  -- JSON extra structured fields
  -- * {boolean} noSparkies
  -- * {boolean} onWindHold
  -- * {number} maxFlightAltitude (meters, AGL)
  -- * {number} maxMotorImpulse (Ns)
  -- * {number} siteLat
  -- * {number} siteLon
  -- * {string} description
  -- * {string} siteName
  extra TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS launches_club ON launches (club);

CREATE INDEX IF NOT EXISTS launches_startTime ON launches (startTime);

CREATE INDEX IF NOT EXISTS launches_endTime ON launches (endTime);

CREATE TRIGGER IF NOT EXISTS launches_updatedAt
AFTER
UPDATE
  ON launches FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  launches
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;

--
-- MOTORS
--
DROP TABLE IF EXISTS motors;

CREATE TABLE IF NOT EXISTS motors (
  motorID TEXT PRIMARY KEY,
  flightID TEXT NOT NULL,
  designation TEXT NOT NULL COLLATE NOCASE,
  -- JSON extra structured fields
  -- * {string} tcMotorID
  -- * {number} impulse (Ns)
  -- * {number} stage (1-n)
  -- * {number} delay (seconds)
  extra TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS motors_flightID ON motors (flightID);

CREATE TRIGGER IF NOT EXISTS motors_updatedAt
AFTER
UPDATE
  ON motors FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  motors
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;

--
-- PADS
--
DROP TABLE IF EXISTS pads;

CREATE TABLE IF NOT EXISTS pads (
  padID TEXT PRIMARY KEY,
  launchID TEXT NOT NULL,
  name TEXT COLLATE NOCASE,
  "group" TEXT COLLATE NOCASE,
  isOnline BOOLEAN NOT NULL DEFAULT TRUE,
  -- JSON extra structured fields
  -- * {boolean} isOnline
  -- * {string} rail
  -- * {number} maxImpulse (Ns)
  -- * {number} minImpulse (Ns)
  extra TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (launchID) REFERENCES launches(launchID)
);

CREATE INDEX IF NOT EXISTS pads_launchID ON pads (launchID);

CREATE TRIGGER IF NOT EXISTS pads_updatedAt
AFTER
UPDATE
  ON pads FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  pads
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;

--
-- ROCKETS
--
DROP TABLE IF EXISTS rockets;

CREATE TABLE IF NOT EXISTS rockets (
  rocketID TEXT PRIMARY KEY,
  userID TEXT NOT NULL,
  name TEXT COLLATE NOCASE,
  -- JSON extra structured fields
  -- * {number} diameter (m)
  -- * {number} length (m)
  -- * {number} mass (kg)
  -- * {string} description
  -- * {string} manufacturer
  -- * {string} notes
  -- * {string} recovery
  extra TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userID) REFERENCES users(userID)
);

CREATE INDEX IF NOT EXISTS rockets_userID ON rockets (userID);

CREATE TRIGGER IF NOT EXISTS rockets_updatedAt
AFTER
UPDATE
  ON rockets FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  rockets
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;

--
-- SESSIONS
--
DROP TABLE IF EXISTS sessions;

CREATE TABLE IF NOT EXISTS sessions (
  sessionID TEXT PRIMARY KEY NOT NULL,
  userID TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userID) REFERENCES users(userID)
);

CREATE TRIGGER IF NOT EXISTS sessions_updatedAt
AFTER
UPDATE
  ON sessions FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  sessions
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;

--
-- USERS
--
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  userID TEXT PRIMARY KEY,
  hostID TEXT,
  firstName TEXT COLLATE NOCASE,
  lastName TEXT COLLATE NOCASE,
  email TEXT COLLATE NOCASE UNIQUE NOT NULL,
  avatarURL TEXT,
  narID INTEGER,
  traID INTEGER,
  units TEXT NOT NULL DEFAULT 'si' CHECK(units IN ('si', 'us')),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hostID) REFERENCES users(userID)
);

CREATE INDEX IF NOT EXISTS users_email ON users (email);

CREATE TRIGGER IF NOT EXISTS users_updatedAt
AFTER
UPDATE
  ON users FOR EACH ROW
  WHEN NEW.updatedAt = OLD.updatedAt BEGIN
UPDATE
  users
SET
  updatedAt = CURRENT_TIMESTAMP
WHERE
  rowid = OLD.rowid;

END;