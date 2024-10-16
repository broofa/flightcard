-- Add collation to firstName
ALTER TABLE certs ADD COLUMN firstName2 TEXT COLLATE NOCASE;
UPDATE certs SET firstName2=firstName;
ALTER TABLE certs DROP COLUMN firstName;
ALTER TABLE certs RENAME COLUMN firstName2 TO firstName;
CREATE INDEX IF NOT EXISTS certs_firstName ON certs (firstName);

-- Add collation to lastName
ALTER TABLE certs ADD COLUMN lastName2 TEXT COLLATE NOCASE;
UPDATE certs SET lastName2=lastName;
ALTER TABLE certs DROP COLUMN lastName;
ALTER TABLE certs RENAME COLUMN lastName2 TO lastName;
CREATE INDEX IF NOT EXISTS certs_lastName ON certs (lastName);
