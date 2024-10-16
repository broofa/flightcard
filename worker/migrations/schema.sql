CREATE TABLE certs (
  memberId INTEGER,
  organization TEXT CHECK( organization IN ('TRA', 'NAR') ),
  level INTEGER,
  expires INTEGER,
  firstName TEXT COLLATE NOCASE,
  lastName TEXT COLLATE NOCASE,
  PRIMARY KEY (memberId, organization)
);

CREATE INDEX certs_organization ON certs (organization);
CREATE INDEX certs_firstName ON certs (firstName);
CREATE INDEX certs_lastName ON certs (lastName);