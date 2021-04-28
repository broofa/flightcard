import React, { useState, useEffect } from 'react';
import Launch from './Launch';
import Launches from './Launches';
import Login from './Login';
import { Switch, Route } from 'react-router-dom';
import { iLaunch, iUser, tRole } from '../types';
import { Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import { Loading } from './util';
import { auth, db } from '../firebase';
import Admin from './Admin';
export const APPNAME = 'FlightCard';

type AppContextState = {
  currentUser ?: iUser
  currentLaunch ?: iLaunch
};

export const appContext = React.createContext<AppContextState>({});

function RangeStatus({ launchId, rangeOpen, enabled }) {
  async function rangeClick() {
    await db.launches.set(`${launchId}/rangeOpen`, !rangeOpen);
  }

  const rangeClass = rangeOpen ? 'success' : 'danger';
  const rangeText = `Range is ${rangeOpen ? 'Open' : 'Closed'}`;

  return enabled
    ? <Button className={`flex-grow-1 bg-${rangeClass}`} onClick={rangeClick}>{rangeText}</Button>
    : <span className={`flex-grow-1 cursor-default text-center font-weight-bold  text-${rangeClass}`}>{rangeText}</span>;
}

function RoleDropdown({ userId, launchId }) {
  function setRole(role : tRole | undefined) {
    db.launchUsers.set(`${launchId}/${userId}/role`, role);
  }

  const canFly = true; // launchUser.permissions?.includes('flier');
  const canLCO = true; // launchUser.permissions?.includes('lco');
  const canRSO = true; // launchUser.permissions?.includes('rso');
  const roleTitle = 'TBD'; // launchUser?.role?.toUpperCase() ?? 'Spectator'

  return <NavDropdown title={`My Role: ${roleTitle}`} id="collasible-nav-dropdown">
    <NavDropdown.Item onClick={() => setRole(undefined)}>Spectator</NavDropdown.Item>
    {canFly ? <NavDropdown.Item onClick={() => setRole('flier')}>Flier</NavDropdown.Item> : null }
    {canLCO ? <NavDropdown.Item onClick={() => setRole('lco')}>Launch Control Officer</NavDropdown.Item> : null }
    {canRSO ? <NavDropdown.Item onClick={() => setRole('rso')}>Range Safety Officer</NavDropdown.Item> : null }
  </NavDropdown>;
}

export default function App() {
  const [currentUserId, setCurrentUserId] = useState<string>();
  // const [ctx, setCtx] = useState({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => auth().onAuthStateChanged(async authUser => {
    if (authUser) {
      // Save/Update in-app user state
      await db.users.set(authUser.uid, {
        id: authUser.uid,
        name: authUser.displayName ?? '(guest)'
      });
      setCurrentUserId(authUser.uid);
    } else {
      setCurrentUserId(undefined);
    }

    setIsLoadingUser(false);
  }), []);

  const currentUser = db.users.useValue(currentUserId);
  const currentLaunchId = currentUser?.currentLaunchId;
  const currentLaunch = db.launches.useValue(currentLaunchId);

  const ctx = {
    currentUserId,
    currentUser,
    currentLaunchId,
    currentLaunch
  };

  const canUpdateRange = true; // /lco/.test(launchUser?.role ?? '');

  return <appContext.Provider value={ctx}>
    <Navbar expand="md" bg='dark' variant='dark'>
      <Navbar.Brand href="/">{APPNAME}</Navbar.Brand>
      {currentLaunchId && currentLaunch
        ? <div className='flex-grow-1 d-flex align-items-baseline'>
            <span className='mr-3 flex-grow-0 text-nowrap text-white text-center'>{currentLaunch?.name}</span>
            <RangeStatus rangeOpen={currentLaunch.rangeOpen} launchId={currentLaunchId} enabled={canUpdateRange} />
          </div>
        : <div className='flex-grow-1' />
      }
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav" className='flex-grow-0'>
        {currentLaunchId ? <RoleDropdown userId={'xxx'} launchId={currentLaunchId} /> : null}
        <Nav.Link onClick={() => auth().signOut()}>Logout</Nav.Link>
        {
          currentUser?.name == 'Robert Kieffer'
            ? <Nav.Link href='/admin'>{'\u2620'}</Nav.Link>
            : null
        }
      </Navbar.Collapse>
    </Navbar>

    <div style={{ margin: '.5em 1em 0 1em' }}>
    {
      isLoadingUser
        ? <Loading wat='User' />
        : !currentUser
            ? <Login />
            : <Switch>
          <Route path="/launches/:launchId" component={Launch} />

          <Route path="/admin">
            <Admin />
          </Route>

          <Route path="/">
            <Launches />
          </Route>
        </Switch>
    }
    </div>
  </appContext.Provider>;
}
