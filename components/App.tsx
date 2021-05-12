import React, { createContext, useEffect, useState } from 'react';
import { Button, ButtonGroup, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { matchPath, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { auth, db, DELETE } from '../firebase';
import { iAttendee, iAttendees, iCards, iLaunch, iLaunchs, iPads, iUser, tRole } from '../types';
import { playSound, RANGE_CLOSED, RANGE_OPEN } from '../util/playSound';
import Admin from './Admin';
import './css/App.scss';
import { ErrorFlash } from './ErrorFlash';
import Launch from './Launch';
import Launches from './Launches';
import Login from './Login';
import { Loading, usePrevious } from './util';
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

function RangeStatus({ launch, isLCO } : { launch : iLaunch, isLCO : boolean }) {
  const [muted, setMuted] = useState(false);
  const { rangeOpen } = launch;
  const prev = usePrevious(rangeOpen);

  async function rangeClick() {
    await db.launch.update(launch.id, { rangeOpen: !rangeOpen });
  }

  if (!muted && prev !== undefined && prev != rangeOpen) playSound(rangeOpen ? RANGE_OPEN : RANGE_CLOSED);

  const variant = rangeOpen ? 'success' : 'danger';
  const text = `Range is ${rangeOpen ? 'Open' : 'Closed'}`;

  return <ButtonGroup className='flex-grow-1'>
      {
        isLCO
          ? <Button variant={variant} onClick={rangeClick}>{text}</Button>
          : <Button variant={`outline-${variant}`} style={{ opacity: 1 }} disabled>{text}</Button>
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
  const location = useLocation();
  const match = matchPath<{currentLaunchId : string}>(location.pathname, '/launches/:currentLaunchId');
  const { currentLaunchId } = match?.params ?? {};

  // const [ctx, setCtx] = useState({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const history = useHistory();

  const [appContext, setAppContext] = useState({});

  const currentUser = db.user.useValue(authId);
  const launches = db.launches.useValue();
  const launch = db.launch.useValue(currentLaunchId);
  const attendees = db.attendees.useValue(currentLaunchId);
  const officers = db.officers.useValue(currentLaunchId);
  const cards = db.cards.useValue(currentLaunchId);
  const pads = db.cards.useValue(currentLaunchId);
  const attendee = attendees?.[currentUser?.id];
  console.log('APP CONTEXT', appContext);
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

  return <AppContext.Provider value={appContext} >
    <Navbar expand='md' bg='dark' variant='dark' className='flex-grow-1 d-flex align-items-baseline'>
      <Navbar.Brand className='flex-grow-0' onClick={() => history.push('/')}>{APPNAME}</Navbar.Brand>
      {
        launch
          ? < >
              <Nav.Link onClick={() => history.push(`/launches/${launch.id}`)} className='mr-3 flex-grow-0'>{launch?.name}</Nav.Link>
              <RangeStatus launch={launch} isLCO={attendee?.role == 'lco'} />
            </>
          : <div className='flex-grow-1' />
        }

      <Navbar.Toggle aria-controls='responsive-navbar-nav' />

      <Navbar.Collapse id='responsive-navbar-nav' className='flex-grow-0'>
        {
          currentUser && launch && <RoleDropdown user={currentUser} launch={launch} />
        }

       {
         currentUser
           ? <NavDropdown alignRight id='settings-dropdown' title='Account &hellip;' >
            {
            currentUser?.id == 'onLzrICBjwXrvbdmwGl0M9rtlI63'
              ? <NavDropdown.Item onClick={() => history.push('/admin')}>Admin</NavDropdown.Item>
              : null
             }
              <NavDropdown.Item disabled={!launch} onClick={() => history.push(`/launches/${launch.id}/profile`)} >Profile</NavDropdown.Item>
            <NavDropdown.Item onClick={() => auth().signOut()}>Logout</NavDropdown.Item>
            </NavDropdown>
           : null
        }
      </Navbar.Collapse>

    </Navbar>

    <div style={{ margin: '1rem 1em 0 1em' }}>
    {
      isLoadingUser
        ? <Loading wat='User (App)' />
        : !currentUser
            ? <Login />
            : <Switch>
          <Route path='/launches/:launchId/:tabKey?' component={Launch} />

          <Route path='/admin'>
            <Admin />
          </Route>

          <Route path='/'>
            <Launches />
          </Route>
        </Switch>
    }
    </div>

    <ErrorFlash />
  </AppContext.Provider>;
}
