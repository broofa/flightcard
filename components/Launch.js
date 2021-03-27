import React from 'react';
import { Switch, Route, useParams } from 'react-router-dom';
import { Button, Tabs, Tab, Badge } from 'react-bootstrap';
import db from '../db.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCurrentUser } from './App.js';
import Cards from './Cards';
import { Waiver } from './Waiver';
import { useLaunchUser, useLaunchUsers } from './hooks';

function nameComparator(a, b) {
  a = a.name;
  b = b.name;
  return a < b ? -1 : b < a ? 1 : 0;
}

function UserGroup({ role, users, children, ...props }) {
  return <div {...props}>
    <h3>{children}</h3>
    {
    users.map(user => {
      const { id, name, launchUser, certType, certLevel } = user;
      if (!launchUser) return null;
      const { role: _role, permissions } = launchUser;
      if (role && !permissions.includes(role)) return null;

      return <div key={id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        <span className="name">{name}
          {role && _role === role ? <Badge className='ml-2' variant='success'>On Duty</Badge> : null}
        </span>
        <span className="role">{role?.toUpperCase() || null}</span>
        <span className="cert">{certType} {certLevel}</span>
      </div>;
    })
  }
  </div>;
}

export default function Launch({ match, history }) {
  const launchId = parseInt(useParams().launchId);
  const user = useCurrentUser();

  const launch = useLiveQuery(() => db.launches.get(launchId), [launchId]);
  const launchUser = useLaunchUser(launchId, user?.id);

  const launchUsers = useLaunchUsers(launchId) || [];
  const userIds = launchUsers.map(u => u.userId).sort();

  const users = useLiveQuery(
    () => db.users.where('id').anyOf(userIds).toArray(),
    [launchUsers.join()]
  );

  if (!users) return <p>Loading users</p>;

  for (const launchUser of launchUsers) {
    const u = users.find(({ id }) => id === launchUser.userId);
    if (u) { u.launchUser = launchUser; }
  }

  users.sort(nameComparator);

  if (!launch || !user || !users) return <p>Loading...</p>;

  if (!launchUser) return <Waiver userId={user.id} launchId={launch.id} />;

  return <>
    <Tabs defaultActiveKey='lco' onSelect={k => history.push(`/launches/${launchId}/${k}`)} >
      <Tab eventKey='lco' title='Launch Control' />
      <Tab eventKey='rso' title='Range Safety' />
      <Tab eventKey='cards' title='Flight Cards' />
      <Tab eventKey='users' title='Spectators' />
    </Tabs>

    <Switch>
      <Route path={`${match.path}/cards/:cardId`}>
        <Cards />
        <Button href={`${match.url}/cards/create`}>New Flight Card</Button>
      </Route>

      <Route path={`${match.path}/cards`}>
        <Button href={`${match.url}/cards/create`}>New Flight Card</Button>
      </Route>

      <Route path={`${match.path}/rso`}>
        <UserGroup users={users} role='rso'>Range Safety</UserGroup>
      </Route>

      <Route path={`${match.path}/users`}>
        <UserGroup users={users} role={undefined}>Spectators</UserGroup>
      </Route>

      <Route path={`${match.path}/lco`}>
        <UserGroup users={users} role='lco'>Launch Control Officers</UserGroup>
      </Route>
    </Switch>
  </>;
}
