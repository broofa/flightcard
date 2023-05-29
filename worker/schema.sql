DROP TABLE IF EXISTS certs;
CREATE TABLE IF NOT EXISTS certs (
  memberId INTEGER PRIMARY KEY,
  firstName TEXT,
  lastName TEXT,
  level INTEGER,
  expires INTEGER,
  organization TEXT CHECK( organization IN ('TRA', 'NAR') )
);
CREATE INDEX IF NOT EXISTS certs_organization ON certs (organization);
INSERT INTO certs (memberId, firstName, lastName, level, expires, organization) VALUES (14491, 'Robert', 'Kieffer', 2, 1693465200000, 'TRA');