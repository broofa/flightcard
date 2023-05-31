DROP TABLE IF EXISTS certs;
CREATE TABLE IF NOT EXISTS certs (
  memberId INTEGER PRIMARY KEY,
  organization TEXT CHECK( organization IN ('TRA', 'NAR') ),
  firstName TEXT,
  lastName TEXT,
  level INTEGER,
  expires INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- UTC
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- UTC
);

CREATE INDEX IF NOT EXISTS certs_organization ON certs (organization);

CREATE TRIGGER update_certs_timestamp AFTER UPDATE ON certs
BEGIN
  UPDATE certs SET updated_at=DATETIME('now') WHERE rowid = new.rowid;
END;

INSERT INTO certs (memberId, firstName, lastName, level, expires, organization) VALUES
 (14491, 'Robert', 'Kieffer', 2, 1693465200000, 'TRA'),
 (123456, 'Robert', 'Kieffer', 0, 0, 'NAR'),
 (123457, 'Fred', 'Flintstone', 0, 0, 'NAR')
;