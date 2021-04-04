import React from 'react';
import Launch from './Launch';
import Launches from './Launches';
import Register from './Register';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { tRole } from '../db';
import { Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import { useCurrentUser, setCurrentUser, useLaunchUser } from './hooks';

export const APPNAME = 'FlightCard';

export function getSessionCookie() : string {
  let sessionId = /fc_sess=([^;]+)/.test(document.cookie) && RegExp.$1;

  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2);
    document.cookie = `fc_sess=${sessionId};path=/;max-age=31536000`;
  }

  return sessionId;
}

export default function App() : React.ReactElement {
  const user = useCurrentUser();
  const match = useRouteMatch<{launchId : string}>('/launches/:launchId');
  const launchId = match?.params.launchId;
  const launch = useLiveQuery(() => {
    if (!launchId) return null;
    return db.launches.get(Number(launchId));
  });
  const launchUser = useLaunchUser(launchId, user?.id);

  let rangeButton : React.ReactElement | null = null;
  const canUpdateRange = /lco/.test(launchUser?.role ?? '');

  function rangeClick() {
    if (!launch) return;

    launch.rangeOpen = !launch.rangeOpen;
    db.launches.put(launch, launch.id);
  }

  function setRole(role : tRole | undefined) {
    if (!launchUser) return;

    if (role) {
      launchUser.role = role;
    } else {
      delete launchUser.role;
    }

    db.launchUsers.put(launchUser);
  }

  if (launch) {
    const rangeClass = launch.rangeOpen ? 'success' : 'danger';
    const rangeText = `Range is ${launch.rangeOpen ? 'Open' : 'Closed'}`;
    rangeButton = canUpdateRange
      ? <Button disabled={!canUpdateRange} className={`flex-grow-1 bg-${rangeClass}`} onClick={rangeClick}>{rangeText}</Button>
      : <span className={`flex-grow-1 cursor-default text-center font-weight-bold  text-${rangeClass}`}>{rangeText}</span>
    ;
  } else {
    rangeButton = null;
  }

  let roleUI;
  if (launchUser) {
    const canFly = launchUser.permissions?.includes('flier');
    const canLCO = launchUser.permissions?.includes('lco');
    const canRSO = launchUser.permissions?.includes('rso');

    roleUI = <NavDropdown title={`My Role: ${launchUser?.role?.toUpperCase() ?? 'Spectator'}`} id="collasible-nav-dropdown">
      <NavDropdown.Item onClick={() => setRole(undefined)}>Spectator</NavDropdown.Item>
      {canFly ? <NavDropdown.Item onClick={() => setRole('flier')}>Flier</NavDropdown.Item> : null }
      {canLCO ? <NavDropdown.Item onClick={() => setRole('lco')}>Launch Control Officer</NavDropdown.Item> : null }
      {canRSO ? <NavDropdown.Item onClick={() => setRole('rso')}>Range Safety Officer</NavDropdown.Item> : null }
    </NavDropdown>;
  }

  return <>
    <Navbar expand="md" bg='dark' variant='dark'>
      <Navbar.Brand href="/">{APPNAME}</Navbar.Brand>
      {launch
        ? <div className='flex-grow-1 d-flex align-items-baseline'>
          <span className='mr-3 flex-grow-0 text-nowrap text-white text-center'>{launch?.name}</span>
          {rangeButton}
        </div>
        : <div className='flex-grow-1' />
      }
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav" className='flex-grow-0'>
        {roleUI}
        <Nav.Link onClick={() => setCurrentUser(null)}>Logout</Nav.Link>
      </Navbar.Collapse>
    </Navbar>

    <div style={{ margin: '.5em 1em 0 1em' }}>
    {
      user
        ? <Switch>
          <Route path="/launches/:launchId" component={Launch} />

          <Route path="/">
            <Launches />
          </Route>
        </Switch>
        : <Register />
    }
    </div>
  </>;
}
