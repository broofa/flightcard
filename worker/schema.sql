-- DROP TABLE IF EXISTS certs;

CREATE TABLE IF NOT EXISTS certs (
  memberId INTEGER,
  organization TEXT CHECK( organization IN ('TRA', 'NAR') ),
  firstName TEXT,
  lastName TEXT,
  level INTEGER,
  expires INTEGER,
  PRIMARY KEY (memberId, organization)
);

CREATE INDEX IF NOT EXISTS certs_organization ON certs (organization);
CREATE INDEX IF NOT EXISTS certs_firstName ON certs (organization);
CREATE INDEX IF NOT EXISTS certs_lastName ON certs (organization);