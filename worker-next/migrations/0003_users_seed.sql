-- Migration number: 0001 	 2024-11-25T00:06:55.699Z
PRAGMA defer_foreign_keys = TRUE;

-- create some test users
INSERT INTO
  users (
    userID,
    firstName,
    lastName,
    email,
    avatarURL,
    narID,
    traID,
    units
  )
VALUES
  (
    'user_1',
    'The Real',
    'Robert',
    'robert@broofa.com',
    "https://lh3.googleusercontent.com/a/ACg8ocImXc_hl_xfMsIXTNu8us-scnEvttXzhqKd3QV5TbePXlsndmFHGg=s96-c",
    111111,
    14491,
    "si"
  ),
  (
    "aed314d8-850c-4aad-bc9f-856a7626b07d",
    "Robert",
    "Kieffer",
    "broofa@gmail.com",
    "https://lh3.googleusercontent.com/a/ACg8ocImXc_hl_xfMsIXTNu8us-scnEvttXzhqKd3QV5TbePXlsndmFHGg=s96-c",
    111111,
    14491,
    "si"
  ) ON CONFLICT DO NOTHING;