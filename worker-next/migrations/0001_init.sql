-- Migration number: 0001 	 2024-11-25T00:06:55.699Z
PRAGMA defer_foreign_keys = TRUE;

--
-- USERS table
--
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  userID TEXT PRIMARY KEY,
  firstName TEXT COLLATE NOCASE,
  lastName TEXT COLLATE NOCASE,
  email TEXT COLLATE NOCASE UNIQUE NOT NULL,
  avatarURL TEXT,
  narID INTEGER,
  traID INTEGER,
  units TEXT NOT NULL DEFAULT 'si' CHECK(units IN ('si', 'us')),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SESSIONS table
--
DROP TABLE IF EXISTS sessions;

CREATE TABLE IF NOT EXISTS sessions (
  sessionID TEXT PRIMARY KEY NOT NULL,
  userID TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userID) REFERENCES users(userID)
);

-- CERTS table
--
DROP TABLE IF EXISTS certs;

CREATE TABLE IF NOT EXISTS certs (
  certID TEXT PRIMARY KEY NOT NULL,
  organization TEXT CHECK(organization IN ('TRA', 'NAR')),
  memberID INTEGER,
  level INTEGER,
  expiresAt INTEGER,
  firstName TEXT COLLATE NOCASE,
  lastName TEXT COLLATE NOCASE
);

CREATE UNIQUE INDEX IF NOT EXISTS certs_organization_memberID ON certs (organization, memberID);

CREATE INDEX IF NOT EXISTS certs_memberID ON certs (memberID);

CREATE INDEX IF NOT EXISTS certs_organization ON certs (organization);

CREATE INDEX IF NOT EXISTS certs_firstName ON certs (firstName);

CREATE INDEX IF NOT EXISTS certs_lastName ON certs (lastName);