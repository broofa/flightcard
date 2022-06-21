import React, { PropsWithChildren } from 'react';
import { Alert, Nav, Navbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { NavLink, Outlet, Route, Routes, useMatch } from 'react-router-dom';
import Admin from '../Admin/Admin';
import {
  CurrentUserProvider,
  useCurrentUser,
} from '../contexts/CurrentUserContext';
import { LaunchProvider, useLaunch } from '../contexts/LaunchContext';
import Login from '../Login';
import './App.scss';
import { RangeStatus } from './RangeStatus';
import { RoleDropdown } from './RoleDropdown';
import { ErrorFlash } from '/components/common/ErrorFlash';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';
import Launch from '/components/Launch/Launch';
import LaunchHome from '/components/Launch/LaunchHome';
import Launches from '/components/Launches';
import { auth, util } from '/rt';
import { ATTENDEE_PATH, OFFICERS_PATH } from '/rt/rtconstants';
import { iAttendee, iOfficers } from '/types';

export const APPNAME = 'FlightCard';
export const ANONYMOUS = '(anonymous)';

function ChromeRoute() {
  return (
    <div style={{ border: 'solid 20px red' }}>
      <h1>Hello</h1>
      <Outlet />
    </div>
  );
}

function LaunchRoute() {
  const [launch, loading, error] = useLaunch();
  const [currentUser] = useCurrentUser();
  const [attendee] = util.useValue<iAttendee>(
    ATTENDEE_PATH.with({
      launchId: launch?.id ?? '',
      userId: currentUser?.id ?? '',
    })
  );
  const [officers] = util.useValue<iOfficers>(
    OFFICERS_PATH.with({ launchId: launch?.id ?? '' })
  );

  if (loading) {
    return <Loading wat='Launch' />;
  } else if (error) {
    return <Alert variant='danger'>LaunchRoute: {error.message}</Alert>;
  } else if (!launch) {
    return <Alert variant='warning'>Launch Not Found</Alert>;
  }

  return (
    <div>
      <Navbar
        bg='dark'
        variant='dark'
        className='position-sticky top-0'
        style={{ zIndex: 3 }}
      >
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

      <div className='p-3' style={{minHeight: '100vh'}}>
        <Outlet />
      </div>

      {launch ? (
        <RangeStatus
          className='position-sticky bottom-0 w-100'
          launch={launch}
          isLCO={attendee?.role == 'lco'}
        />
      ) : null}

      <ErrorFlash />
    </div>
  );
}

function ProtectedRoute<Route>({ children }: PropsWithChildren) {
  const [currentUser, loading, error] = useCurrentUser();
  if (loading) {
    return <Route element={<Loading wat='User Credentials' />} />;
  } else if (error) {
    return <Route element={<Alert variant='danger'>{error.message}</Alert>} />;
  } else if (!currentUser) {
    return <Route element={<Login />} />;
  }

  return <>{children}</>;
}

export default function App() {
  const match = useMatch<'launchId', string>('/launches/:launchId/*');
  const { launchId } = match?.params ?? {};

  return (
    <LaunchProvider launchId={launchId}>
      <CurrentUserProvider>
        <Routes>
          {/* <Route path='*' element={<h1>World</h1>} /> */}
          {/* <ProtectedRoute> */}
          <Route index element={<Launches />} />
          <Route path='/admin' element={<Admin />} />
          <Route element={<LaunchRoute />}>
            <Route path='/launches/:launchId' element={<LaunchHome />} />
            <Route path='/launches/:launchId/*' element={<Launch />} />
          </Route>
          {/* </ProtectedRoute> */}
        </Routes>
      </CurrentUserProvider>
    </LaunchProvider>
  );
}
