-- Migration number: 0001 	 2024-11-25T00:06:55.699Z
PRAGMA defer_foreign_keys = TRUE;

--
-- ROCKETS table
--
DROP TABLE IF EXISTS rockets;

CREATE TABLE IF NOT EXISTS rockets (
  rocketID TEXT PRIMARY KEY,
  userID TEXT NOT NULL,
  name TEXT COLLATE NOCASE,
  color TEXT COLLATE NOCASE,
  recovery TEXT CHECK(
    recovery IN (
      'chute',
      'streamer',
      'dual-deploy',
      'tumble',
      'helicopter',
      'glide'
    )
  ),
  diameter REAL,
  length REAL,
  mass REAL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);