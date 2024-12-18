-- Migration number: 0001 	 2024-11-25T00:06:55.699Z
PRAGMA defer_foreign_keys = TRUE;

-- create some test rockets
INSERT INTO
  rockets (
    rocketID,
    userID,
    name,
    manufacturer,
    color,
    recovery,
    diameter,
    length,
    mass
  )
VALUES
  (
    'rocket_1',
    'user_1',
    'Alpha',
    'Estes',
    'red',
    'chute',
    2.6,
    24.0,
    0.5
  ),
  (
    'rocket_2',
    'user_1',
    'Beta',
    'Mad Cow',
    'blue',
    'streamer',
    2.6,
    24.0,
    0.5
  ),
  (
    'rocket_3',
    'user_1',
    'Gamma',
    'Public Missile',
    'green',
    'dual-deploy',
    2.6,
    24.0,
    0.5
  ),
  (
    'rocket_4',
    'user_2',
    'Delta',
    'SBR',
    'yellow',
    'tumble',
    2.6,
    24.0,
    0.5
  ),
  (
    'rocket_5',
    'user_2',
    'Epsilon',
    'LOC',
    'purple',
    'helicopter',
    2.6,
    24.0,
    0.5
  ),
  (
    'rocket_6',
    'user_2',
    'Zeta',
    'Binder Designs',
    'orange',
    'glide',
    2.6,
    24.0,
    0.5
  );