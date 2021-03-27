import React from 'react';
import Launch from './Launch.js';
import Launches from './Launches.js';
import Register from './Register.js';
import User from './User.js';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db.js';
import { Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import { useLaunchUser } from './hooks';

export const APPNAME = 'FlightCard';

let sess = /fc_sess=([^;]+)/.test(document.cookie) && RegExp.$1;
if (!sess) {
  sess = Math.random().toString(36).substr(2);
  document.cookie = `fc_sess=${sess};path=/;max-age=31536000`;
}

export function setCurrentUser(user) {
  if (!user) {
    db.sessions.where({ id: sess }).delete();
  } else {
    db.sessions.add({ id: sess, userId: user.id });
  }
}
export function useCurrentUser() {
  const session = useLiveQuery(() => sess && db.sessions.get({ id: sess }), [sess]);
  const userId = session?.userId;
  const user = useLiveQuery(() => userId && db.users.get(userId), [sess, userId]);
  return user;
}

export default function App() {
  const user = useCurrentUser();
  const match = useRouteMatch('/launches/:launchId');
  const launchId = match?.params.launchId;
  const launch = useLiveQuery(() => launchId && db.launches.get(Number(launchId)));
  const launchUser = useLaunchUser(launchId, user?.id);

  function rangeClick() {
    launch.rangeOpen = !launch.rangeOpen;
    db.launches.put(launch, launch.id);
  }

  function setRole(role) {
    if (role) {
      launchUser.role = role;
    } else {
      delete launchUser.role;
    }

    db.launchUsers.put(launchUser);
  }

  let rangeClass, rangeText;
  let rangeStatus = null;
  if (launch) {
    rangeClass = `nav-brand flex-grow-1 bg-${launch.rangeOpen ? 'success' : 'danger'}`;
    rangeText = `${launch.name} (Range is ${launch.rangeOpen ? 'Open' : 'Closed'})`;
    rangeStatus = <Button className={rangeClass} onClick={rangeClick}>{rangeText}</Button>;
  } else {
    rangeStatus = <div className='flex-grow-1' />;
  }

  let roleUI;
  if (launchUser) {
    const canFly = launchUser?.permissions.includes('flier');
    const canLCO = launchUser?.permissions.includes('lco');
    const canRSO = launchUser?.permissions.includes('rso');

    roleUI = <NavDropdown title={`Currently: ${launchUser?.role?.toUpperCase() ?? 'Spectator'}`} id="collasible-nav-dropdown">
      <NavDropdown.Item onClick={() => setRole(undefined)}>Spectator</NavDropdown.Item>
      {canFly ? <NavDropdown.Item onClick={() => setRole('flier')}>Flier</NavDropdown.Item> : null }
      {canLCO ? <NavDropdown.Item onClick={() => setRole('lco')}>Launch Control Officer</NavDropdown.Item> : null }
      {canRSO ? <NavDropdown.Item onClick={() => setRole('rso')}>Range Safety Officer</NavDropdown.Item> : null }
    </NavDropdown>;
  }

  return <>
    <Navbar expand="md" bg='dark' variant='dark'>
      <Navbar.Brand href="/">{APPNAME}</Navbar.Brand>
      {rangeStatus}
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav" className='flex-grow-0'>
        {roleUI}
        <Nav.Link href={`/users/${user?.id}`}>Account</Nav.Link>
        <Nav.Link onClick={() => setCurrentUser(null)}>Logout</Nav.Link>
      </Navbar.Collapse>
    </Navbar>

    <div style={{ margin: '.5em 1em 0 1em' }}>
    {
      user
        ? <Switch>
          <Route path="/launches/:launchId" component={Launch} />

          <Route path="/users/:userId">
            <User />
          </Route>

          <Route path="/">
            <Launches />
          </Route>
        </Switch>
        : <Register />
    }
    </div>
  </>;
}
