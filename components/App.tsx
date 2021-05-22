import React, { createContext, useEffect, useState } from 'react';
import { Button, ButtonGroup, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import { auth, db, DELETE } from '../firebase';
import { iAttendee, iAttendees, iCards, iLaunch, iLaunchs, iPads, iUser, tRole } from '../types';
import { playSound, RANGE_CLOSED, RANGE_OPEN } from '../util/playSound';
import Admin from './Admin';
import './css/App.scss';
import { ErrorFlash } from './ErrorFlash';
import Icon from './Icon';
import Launch from './Launch';
import Launches from './Launches';
import Login from './Login';
import { Loading, tProps, usePrevious } from './util';

export const APPNAME = 'FlightCard';

type tAppContext = {
  currentUser ?: iUser;
  launches ?: iLaunchs;
  launch ?: iLaunch;
  attendees ?: iAttendees;
  officers ?: Record<string, boolean>;
  attendee ?: iAttendee;
  cards ?: iCards;
  pads ?: iPads;
};
export const AppContext = createContext<tAppContext>({});

function RangeStatus({ launch, isLCO, ...props } :
   { launch : iLaunch, isLCO : boolean } & tProps) {
  const [muted, setMuted] = useState(false);
  const { rangeOpen } = launch;
  const prev = usePrevious(rangeOpen);

  async function rangeClick() {
    await db.launch.update(launch.id, { rangeOpen: !rangeOpen });
  }

  if (!muted && prev !== undefined && prev != rangeOpen) playSound(rangeOpen ? RANGE_OPEN : RANGE_CLOSED);

  const variant = rangeOpen ? 'success' : 'danger';
  const text = `Range is ${rangeOpen ? 'Open' : 'Closed'}`;

  return <ButtonGroup {...props}>
      {
        isLCO
          ? <Button variant={variant} onClick={rangeClick}>{text}</Button>
          : <Button className='fw-bold' variant={`outline-${variant}`} style={{ opacity: 1 }} disabled>{text}</Button>
      }
    <Button variant={`outline-${variant}`} title='Toggle announcement volume' className='flex-grow-0' onClick={() => setMuted(!muted)}>{muted ? '\u{1F507}' : '\u{1F508}'}</Button>
  </ButtonGroup>
  ;
}

function RoleDropdown({ launch, user } : {launch : iLaunch, user : iUser}) {
  const isOfficer = db.officer.useValue(launch.id, user.id);
  const attendee = db.attendee.useValue(launch.id, user.id);

  function setRole(role : tRole | undefined) {
    db.attendee.update(launch.id, user.id, { role });
  }

  if (!attendee) return null;

  const roleTitle = attendee.role?.toUpperCase() ?? 'Off Duty';

  return <NavDropdown title={roleTitle} id='collasible-nav-dropdown'>
    <NavDropdown.Item onClick={() => setRole(undefined)}>Off Duty</NavDropdown.Item>
    {
      isOfficer
        ? <>
        <NavDropdown.Item onClick={() => setRole('lco')}>LCO</NavDropdown.Item>
        <NavDropdown.Item onClick={() => setRole('rso')}>RSO</NavDropdown.Item>
      </>
        : null
    }
  </NavDropdown>;
}

export default function App() {
  const [authId, setAuthId] = useState<string>();
  const match = useRouteMatch<{launchId : string}>('/launches/:launchId');
  const { launchId } = match?.params ?? {};

  // const [ctx, setCtx] = useState({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [appContext, setAppContext] = useState({});

  const currentUser = db.user.useValue(authId);
  const launches = db.launches.useValue();
  const launch = db.launch.useValue(launchId);
  const attendees = db.attendees.useValue(launchId);
  const officers = db.officers.useValue(launchId);
  const cards = db.cards.useValue(launchId);
  const pads = db.pads.useValue(launchId);
  const attendee = attendees?.[currentUser?.id];

  // Effect: Update authId when user is authenticated / logs out
  useEffect(() => auth().onAuthStateChanged(async authUser => {
    if (authUser) {
      // Save/Update in-app user state
      await db.user.update(authUser.uid, {
        id: authUser.uid,
        name: authUser.displayName ?? '(guest)',
        photoURL: authUser.photoURL ?? DELETE
      });
      setAuthId(authUser.uid);
    } else {
      setAuthId(undefined);
    }

    setIsLoadingUser(false);
  }), []);

  // Effect: Update app-wide shared state
  useEffect(() => {
    setAppContext({
      attendee,
      attendees,
      cards,
      launch,
      launches,
      currentUser,
      officers,
      pads
    });
  }, [
    attendee,
    attendees,
    cards,
    launch,
    launches,
    currentUser,
    officers,
    pads
  ]);

  (window as any).appContext = appContext;
  return <AppContext.Provider value={appContext} >
    <div className='d-flex flex-column vh-100'>
      <Navbar bg='dark' variant='dark' className='d-flex align-items-center'>
      {
        currentUser && launch
          ? <>
              {
                [
                  ['', 'house-fill'],
                  ['cards', 'card-heading'],
                  ['rso', 'officer'],
                  ['lco', 'rocket'],
                  ['users', 'people'],
                  ['profile', 'person-square']
                ].map(([path, icon]) => <NavLink to={`/launches/${launch.id}/${path}`} exact key={path} className='flex-grow-1 text-center'>
                {<Icon size='2em' name={icon} />}
                </NavLink>)
              }
              {
                attendee && officers?.[attendee.id]
                  ? <RoleDropdown user={currentUser} launch={launch} />
                  : null
              }
            </>
          : <>
              <LinkContainer className='ms-2' to={'/'} ><Navbar.Brand>{APPNAME}</Navbar.Brand></LinkContainer>
              <div className='flex-grow-1' />
              {
                currentUser
                  ? <Nav.Link onClick={() => auth().signOut()}>Logout</Nav.Link>
                  : null
              }
            </>
        }
      </Navbar>

      <div className='flex-grow-1 overflow-auto p-3'>
      {
        isLoadingUser
          ? <Loading wat='User (App)' />
          : !currentUser
              ? <Login />
              : <Switch>
            <Route path='/launches/:launchId?' component={Launch} />

            <Route path='/admin'>
              <Admin />
            </Route>

            <Route path='/'>
              <Launches />
            </Route>
          </Switch>
      }
      </div>

      {
        launch
          ? <RangeStatus className='text-white bg-dark flex-grow-0' launch={launch} isLCO={attendee?.role == 'lco'} />
          : null
      }

      <ErrorFlash />
    </div>
  </AppContext.Provider>;
}
