import React, { useState, useEffect } from 'react';
import Launch from './Launch';
import Launches from './Launches';
import Login from './Login';
import { Switch, Route, useHistory } from 'react-router-dom';
import { iLaunch, iLaunchUser, iUser, tRole } from '../types';
import { Navbar, Nav, NavDropdown, Button, ButtonGroup } from 'react-bootstrap';
import { CLOSE_SOUND, Loading, OPEN_SOUND, playSound, usePrevious } from './util';
import { auth, db } from '../firebase';
import Admin from './Admin';

export const APPNAME = 'FlightCard';

type AppContextState = {
  currentUser ?: iUser
  currentLaunch ?: iLaunch
  currentLaunchUser ?: iLaunchUser
};

export const appContext = React.createContext<AppContextState>({});

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

  return <ButtonGroup className='flex-grow-1'>
      {
        isLCO
          ? <Button variant={variant} onClick={rangeClick}>{text}</Button>
          : <Button variant={`outline-${variant}`} style={{ opacity: 1 }} disabled>{text}</Button>
      }
    <Button variant={ variant } title='Toggle announcement volume' className='flex-grow-0' onClick={() => setMuted(!muted)}>{muted ? '\u{1F507}' : '\u{1F508}'}</Button>
  </ButtonGroup>
  ;
}

function RoleDropdown({ launch, user } : {launch : iLaunch, user : iUser}) {
  const perm = db.launchPerm.useValue(launch.id, user.id);
  const launchUser = db.launchUser.useValue(launch.id, user.id);

  function setRole(role : tRole | undefined) {
    db.launchUser.update(launch.id, user.id, { role });
  }

  if (!perm || !launchUser) return null;

  const roleTitle = launchUser.role?.toUpperCase() ?? 'Off Duty';

  return <NavDropdown title={roleTitle} id='collasible-nav-dropdown'>
    <NavDropdown.Item onClick={() => setRole(undefined)}>Off Duty</NavDropdown.Item>
    {perm?.lco && <NavDropdown.Item onClick={() => setRole('lco')}>LCO</NavDropdown.Item> }
    {perm?.rso && <NavDropdown.Item onClick={() => setRole('rso')}>RSO</NavDropdown.Item> }
  </NavDropdown>;
}

export default function App() {
  const [userId, setUserId] = useState<string>();
  // const [ctx, setCtx] = useState({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const history = useHistory();

  useEffect(() => auth().onAuthStateChanged(async authUser => {
    if (authUser) {
      // Save/Update in-app user state
      await db.user.update(authUser.uid, {
        id: authUser.uid,
        name: authUser.displayName ?? '(guest)'
      });
      setUserId(authUser.uid);
    } else {
      setUserId(undefined);
    }

    setIsLoadingUser(false);
  }), []);

  const currentUser = db.user.useValue(userId);
  const currentLaunch = db.launch.useValue(currentUser?.currentLaunchId);
  const currentLaunchUser = db.launchUser.useValue(currentLaunch?.id, currentUser?.id);

  const ctx : AppContextState = { currentUser, currentLaunch, currentLaunchUser };

  console.log('LOD', currentLaunch?.id, currentUser?.id, currentLaunchUser?.id);

  return <appContext.Provider value={ctx}>
    <Navbar expand='md' bg='dark' variant='dark'>
      <Navbar.Toggle aria-controls='responsive-navbar-nav' />

      <Navbar.Brand onClick={() => history.push('/')}>{APPNAME}</Navbar.Brand>

      {
        currentLaunch
          ? <div className='flex-grow-1 d-flex align-items-baseline'>
              <Nav.Link onClick={() => history.push(`/launches/${currentLaunch.id}`)} className='mr-3 flex-grow-0 text-nowrap'>{currentLaunch?.name}</Nav.Link>
              <RangeStatus launch={currentLaunch} isLCO={currentLaunchUser?.role == 'lco'} />
            </div>
          : <div className='flex-grow-1' />
      }

      <Navbar.Collapse id='responsive-navbar-nav' className='flex-grow-0'>
        {
          currentUser && currentLaunch && <RoleDropdown user={currentUser} launch={currentLaunch} />
        }

        {
          currentUser?.id == '2ec4MLwSZ2dwRBIjGzTVIxDU09i1'
            ? <Nav.Link onClick={() => history.push('/admin')}>{'\u2620'}</Nav.Link>
            : null
        }

        {
          currentUser && <Nav.Link onClick={() => auth().signOut()}>Logout</Nav.Link>
        }
      </Navbar.Collapse>

    </Navbar>

    <div style={{ margin: '.5em 1em 0 1em' }}>
    {
      isLoadingUser
        ? <Loading wat='User (App)' />
        : !currentUser
            ? <Login />
            : <Switch>
          <Route path='/launches/:launchId' component={Launch} />

          <Route path='/admin'>
            <Admin />
          </Route>

          <Route path='/'>
            <Launches />
          </Route>
        </Switch>
    }
    </div>
  </appContext.Provider>;
}
