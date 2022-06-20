import md5 from 'blueimp-md5';
import React, { createContext, useEffect, useState } from 'react';
import { Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { NavLink, Route, Routes, useMatch } from 'react-router-dom';
import { MKS, tUnitSystem, USCS } from '../../util/units';
import Admin from '../Admin/Admin';
import './App.scss';
import { RangeStatus } from './RangeStatus';
import { ErrorFlash } from '/components/common/ErrorFlash';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';
import Launch from '/components/Launch/Launch';
import Launches from '/components/Launches';
import NavButton from '/components/Launch/LaunchHome';
import Login from '/components/Login';
import { auth, db, DELETE } from '/firebase';
import {
  iAttendee,
  iAttendees,
  iCards,
  iLaunch,
  iLaunchs,
  iPads,
  iUser,
  tRole,
} from '/types';

export const APPNAME = 'FlightCard';
export const ANONYMOUS = '(anonymous)';

// Enhancements to globals
declare global {
  interface Window {
    appContext: tAppContext;
  }
}

type tAppContext = {
  currentUser?: iUser;
  userUnits: tUnitSystem;
  launches?: iLaunchs;
  launch?: iLaunch;
  attendees?: iAttendees;
  officers?: Record<string, boolean>;
  attendee?: iAttendee;
  cards?: iCards;
  pads?: iPads;
};

const DEFAULT_APP_STATE = { userUnits: MKS };

export const AppContext = createContext<tAppContext>(DEFAULT_APP_STATE);

function RoleDropdown({ launch, user }: { launch: iLaunch; user: iUser }) {
  const isOfficer = db.officer.useValue(launch.id, user.id);
  const attendee = db.attendee.useValue(launch.id, user.id);

  function setRole(role?: tRole) {
    db.attendee.update(launch.id, user.id, { role });
  }

  if (!attendee) return null;

  const roleTitle = attendee.role?.toUpperCase() ?? 'Off Duty';

  return (
    <NavDropdown title={roleTitle} id='collasible-nav-dropdown'>
      <NavDropdown.Item onClick={() => setRole(undefined)}>
        Off Duty
      </NavDropdown.Item>
      {isOfficer ? (
        <>
          <NavDropdown.Item onClick={() => setRole('lco')}>
            LCO
          </NavDropdown.Item>
          <NavDropdown.Item onClick={() => setRole('rso')}>
            RSO
          </NavDropdown.Item>
        </>
      ) : null}
    </NavDropdown>
  );
}

export default function App() {
  const [authId, setAuthId] = useState<string>();
  const match = useMatch<'launchId', string>('/launches/:launchId/*');
  const { launchId } = match?.params ?? {};

  // const [ctx, setCtx] = useState({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [appContext, setAppContext] = useState<tAppContext>({
    ...DEFAULT_APP_STATE,
  });

  const currentUser = db.user.useValue(authId);
  const launches = db.launches.useValue();
  const launch = db.launch.useValue(launchId);
  const attendees = db.attendees.useValue(launchId);
  const officers = db.officers.useValue(launchId);
  const cards = db.cards.useValue(launchId);
  const pads = db.pads.useValue(launchId);
  const attendee = attendees?.[currentUser?.id];

  // Effect: Update authId when user is authenticated / logs out
  useEffect(
    () =>
      auth.onAuthStateChanged(async authUser => {
        if (authUser) {
          let { photoURL } = authUser;

          if (!photoURL && authUser.email) {
            // Use Gravatar image
            const hash = md5(authUser.email.toLowerCase());
            photoURL = `https://gravatar.com/avatar/${hash}?d=robohash`;
          }

          const user: iUser = {
            id: authUser.uid,
            photoURL: photoURL ?? DELETE,
          };
          if (authUser.displayName) user.name = authUser.displayName;

          // Save/Update in-app user state
          await db.user.update(authUser.uid, user);
          setAuthId(authUser.uid);
          setIsLoadingUser(false);
        } else {
          setAuthId(undefined);
          setIsLoadingUser(false);
        }
      }),
    []
  );

  // Effect: Update app-wide shared state
  useEffect(() => {
    const userUnits = currentUser?.units == 'uscs' ? USCS : MKS;

    setAppContext({
      attendee,
      attendees,
      cards,
      launch,
      launches,
      currentUser,
      userUnits,
      officers,
      pads,
    });
  }, [
    attendee,
    attendees,
    cards,
    launch,
    launches,
    currentUser,
    officers,
    pads,
  ]);

  window.appContext = appContext;

  if (isLoadingUser) return <Loading className='busy' wat='Credentials' />;

  if (!currentUser) {
    return (
      <>
        <Login />
        <ErrorFlash />
      </>
    );
  }

  return (
    <AppContext.Provider value={appContext}>
      <div className='d-flex flex-column vh-100'>
        <Navbar bg='dark' variant='dark' className='d-flex py-0'>
          {currentUser && launch ? (
            <>
              {[
                ['', 'house-fill'],
                ['cards', 'card-fill'],
                ['rso', 'officer'],
                ['lco', 'rocket'],
                ['users', 'people-fill'],
                ['profile', 'gear-fill'],
              ].map(([path, icon]) => (
                <NavLink
                  to={`/launches/${launch.id}/${path}`}
                  key={path}
                  className='flex-grow-1 text-center py-2'
                >
                  {<Icon size='2em' name={icon} />}
                </NavLink>
              ))}
              {attendee && officers?.[attendee.id] ? (
                <RoleDropdown user={currentUser} launch={launch} />
              ) : null}
            </>
          ) : (
            <>
              <LinkContainer className='ms-2' to={'/'}>
                <Navbar.Brand>{APPNAME}</Navbar.Brand>
              </LinkContainer>
              <div className='flex-grow-1' />
              {currentUser ? (
                <Nav.Link onClick={() => auth.signOut()}>Logout</Nav.Link>
              ) : null}
            </>
          )}
        </Navbar>

        <div className='flex-grow-1 overflow-auto p-3'>
          {!currentUser ? (
            <Login />
          ) : (
            <Routes>
              <Route path='/' element={<Launches />} />
              <Route path='/admin' element={<Admin />} />
              <Route path='/launches/:launchId' element={<NavButton />} />
              <Route path='/launches/:launchId/*' element={<Launch />} />
            </Routes>
          )}
        </div>

        {launch ? (
          <RangeStatus
            className='text-white bg-dark flex-grow-0'
            launch={launch}
            isLCO={attendee?.role == 'lco'}
          />
        ) : null}

        <ErrorFlash />
      </div>
    </AppContext.Provider>
  );
}
