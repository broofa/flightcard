PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (   userID INTEGER PRIMARY KEY,   narID INTEGER,   traID INTEGER,   firstName TEXT COLLATE NOCASE,   lastName TEXT COLLATE NOCASE,   email TEXT COLLATE NOCASE,   avatarURL TEXT );
CREATE TABLE sessions (   sessionID TEXT PRIMARY KEY,   userID INTEGER,   expires INTEGER,    FOREIGN KEY (userID) REFERENCES users(userID) );
