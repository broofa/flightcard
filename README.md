# FlightCard

An application for managing model rocketry launch events.

## Contributing

This project is open source under [ISC License](https://opensource.org/licenses/ISC). Contributors are welcome.

### Dev Environment

You use VSCode, right?

<img width="200" src="https://i.imgflip.com/rqk1m.jpg" />

(It's not _required_ but, boy, will it make your life easier. )

**TODO**:

- [ ] Set up `lefthook` to ensure pre-commit scripts run
- [ ] Configure [recommended extensions](https://code.visualstudio.com/docs/editor/extension-marketplace#_recommended-extensions)
- [ ] `pre-commit` script for code linting
- [ ] `pre-commit` script for tests

### Architecture / Overview

FlightCard is a single-page web app (SPA), with the following architecture:

```mermaid
graph TB
  client[Browser]
  fb["Firebase (auth + db)"]
  cf["Cloudflare (member certification API)"]
  client --> fb
  client --> cf
```

#### Browser

The browser client is a single-page app (SPA), using TypeScript + React. User authentication is handled using Google's [Firebase `auth` service](https://firebase.google.com/docs/auth). All app data (launches, attendees, flightcards, etc...) is stored in the [Realtime Database()](https://firebase.google.com/docs/database).

The React components can be found in the `components` directory.

**Note**: Because this app uses the Realtime Database, changes to data are automatically synced cross _all_ clients. This, combined with the realtime React hooks (see `rt` directory) upon which most of the components are built, means that pretty much any change a user may make will appear immediately to all other users. (Cool, right?!?)

#### Google Firebase

There's not a whole lot to say about this. It's a data store with an API that pushes changes to the backend data out to all clients in realtime. This, combined with the React hooks in the `rt` directory (used to render backend data into a component) mean any change user makes will be synced to all users, in realtime(!).

Contributors will need to set up their own Firebase account and configure it accordingly. (Instructions forthcoming).

**TODO**:

- [ ] Document how to stand up a `dev` database with configured [security rules](https://github.com/broofa/flightcard/blob/main/rules.json).

#### Cloudflare Worker

Information about TRA and NAR member certifications (set in the user's profile page) is fetched from a small API implemented in a CloudFlare worker. The code for this is in the `worker` directory.

Member cert information is actually cached in [CloudFlare's KV Store](https://developers.cloudflare.com/workers/runtime-apis/kv/). The scripts used to initially seed the store are in `worker/src/publish_*`. There is also a scheduled event in the worker itself (`worker/src/index.ts#schedule`) that keeps the KV store updated with any new changes to member information. This runs once per day. (I.e. It may take up to 24 hours for a member's information to be updated when it changes.)

Much like Firebase, contributors will need to set up their own Cloudflare account and configure a worker.

**TODO**:

- [ ] Document how to stand up a `dev` worker + KV namespace seeded with sample member cert info.
