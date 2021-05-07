import React, { useEffect, useState } from 'react';
import { Alert, Button, ButtonGroup, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { matchPath, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { auth, db, DELETE } from '../firebase';
import { iAttendee, iLaunch, iUser, tRole } from '../types';
import Admin from './Admin';
import './css/App.scss';
import Launch from './Launch';
import Launches from './Launches';
import Login from './Login';
import sharedStateHook from './sharedStateHook';
import { CLOSE_SOUND, Loading, OPEN_SOUND, playSound, usePrevious } from './util';
export const APPNAME = 'FlightCard';

export const useCurrentUser = sharedStateHook<iUser | undefined>(undefined, 'currentUser');
export const useCurrentLaunch = sharedStateHook<iLaunch | undefined>(undefined, 'currentLaunch');
export const useCurrentAttendee = sharedStateHook<iAttendee | undefined>(undefined, 'currentAttendee');

// Wrapper function that surfaces errors in ErrorFlash
interface tErrTrap {
  (action : (...args : any[]) => Promise<any>) : any;
  onError ?: ((err : Error) => void)
}
export const errTrap : tErrTrap = (action) => {
  return async function(...args) {
    try {
      return await (action as any)(...args);
    } catch (err) {
      console.log('ERRR', err);
      (errTrap as unknown as any)?.onError(err);
    }
  };
};

function ErrorFlash() {
  const [err, setErr] = useState<Error>();
  useEffect(() => {
    function handleError(err) {
      setErr(err);
      setTimeout(() => setErr(undefined), 3000);
    }
    errTrap.onError = handleError;

    return () => {
      if (errTrap.onError === handleError) {
        delete errTrap.onError;
      }
    };
  }, []);

  return err
    ? <Alert variant='danger' style={{
      position: 'fixed',
      zIndex: 9999,
      bottom: 0,
      left: '20%',
      right: '20%'
    }}>
        {(err as any).code ?? err.message}
      </Alert>
    : null;
}

function RangeStatus({ launch, isLCO } : { launch : iLaunch, isLCO : boolean }) {
  const [muted, setMuted] = useState(false);
  const { rangeOpen } = launch;
  const prev = usePrevious(rangeOpen);

  async function rangeClick() {
    await db.launch.update(launch.id, { rangeOpen: !rangeOpen });
  }

  if (!muted && prev !== undefined && prev != rangeOpen) playSound(rangeOpen ? OPEN_SOUND : CLOSE_SOUND);

  const variant = rangeOpen ? 'success' : 'danger';
  const text = `Range is ${rangeOpen ? 'Open' : 'Closed'}`;

  function toggleSound() {
    // Test to see if we can get sound to play on iOS
    playSound(OPEN_SOUND, true);
    playSound(CLOSE_SOUND, true);

    setMuted(!muted);
  }

  return <ButtonGroup className='flex-grow-1'>
      {
        isLCO
          ? <Button variant={variant} onClick={rangeClick}>{text}</Button>
          : <Button variant={`outline-${variant}`} style={{ opacity: 1 }} disabled>{text}</Button>
      }
    <Button variant={`outline-${variant}`} title='Toggle announcement volume' className='flex-grow-0' onClick={toggleSound}>{muted ? '\u{1F507}' : '\u{1F508}'}</Button>
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

  const [currentUser, setCurrentUser] = useCurrentUser();
  const [currentLaunch, setCurrentLaunch] = useCurrentLaunch();
  const [currentAttendee, setCurrentAttendee] = useCurrentAttendee();

  const user = db.user.useValue(authId);
  const launch = db.launch.useValue(currentLaunchId);
  const attendee = db.attendee.useValue(currentLaunchId, user?.id);

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

    function handleError(e) {
      console.log('unhandledrejection', e);
    }
    window.addEventListener('unhandledrejection', handleError);

    setIsLoadingUser(false);

    return () => {
      window.removeEventListener('unhandledrejection', handleError);
    };
  }), []);

  // Effect: Update shared state if/when it changes
  useEffect(() => {
    setCurrentUser(user);
    setCurrentLaunch(launch);
    setCurrentAttendee(attendee);
  }, [user, launch, attendee]);

  return <>
    <Navbar expand='md' bg='dark' variant='dark' className='flex-grow-1 d-flex align-items-baseline'>
      <Navbar.Brand className='flex-grow-0' onClick={() => history.push('/')}>{APPNAME}</Navbar.Brand>
      {
        currentLaunch
          ? < >
              <Nav.Link onClick={() => history.push(`/launches/${currentLaunch.id}`)} className='mr-3 flex-grow-0'>{currentLaunch?.name}</Nav.Link>
              <RangeStatus launch={currentLaunch} isLCO={currentAttendee?.role == 'lco'} />
            </>
          : <div className='flex-grow-1' />
        }

      <Navbar.Toggle aria-controls='responsive-navbar-nav' />

      <Navbar.Collapse id='responsive-navbar-nav' className='flex-grow-0'>
        {
          currentUser && currentLaunch && <RoleDropdown user={currentUser} launch={currentLaunch} />
        }

       {
         currentUser
           ? <NavDropdown alignRight id='settings-dropdown' title='Account &hellip;' >
            {
            currentUser?.id == '2ec4MLwSZ2dwRBIjGzTVIxDU09i1'
              ? <NavDropdown.Item onClick={() => history.push('/admin')}>Admin</NavDropdown.Item>
              : null
             }
              <NavDropdown.Item onClick={() => history.push(`/launches/${launch.id}/profile`)} >Profile</NavDropdown.Item>
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
  </>;
}
