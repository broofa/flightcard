import React from 'react';
import { Alert, Nav, Navbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useMatch,
} from 'react-router-dom';
import Admin from '../Admin/Admin';
import { AuthUserProvider, useAuthUser } from '../contexts/AuthIdContext';
import { LaunchProvider, useLaunch } from '../contexts/LaunchContext';
import { useCurrentUser } from '../contexts/rthooks';
import Launch from '../Launch/Launch';
import LaunchHome from '../Launch/LaunchHome';
import Launches from '../Launches';
import Login from '../Login/Login';
import './App.scss';
import { RangeStatus } from './RangeStatus';
import { RoleDropdown } from './RoleDropdown';
import { ErrorFlash } from '/components/common/ErrorFlash';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';
import { auth, util } from '/rt';
import { ATTENDEE_PATH, OFFICERS_PATH } from '/rt/rtconstants';
import { iAttendee, iOfficers } from '/types';

export const APPNAME = 'FlightCard';
export const ANONYMOUS = '(anonymous)';

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

      <div className='p-3' style={{ minHeight: '100vh' }}>
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

// REF: https://stackoverflow.com/a/69592617/109538
function RequireAuth() {
  const [authUser, loading, error] = useAuthUser();
  const location = useLocation();

  if (loading) {
    return <Loading wat='User Credentials' />;
  } else if (error) {
    return (
      <Alert variant='danger'>Authentication error: {error.message}</Alert>
    );
  } else if (!authUser) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default function App() {
  const match = useMatch<'launchId', string>('/launches/:launchId/*');
  const { launchId } = match?.params ?? {};

  return (
    <AuthUserProvider>
      <LaunchProvider launchId={launchId}>
        <Routes>
          <Route path='/login' element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route path='/' element={<Navigate to='/launches' />} />
            <Route path='/admin' element={<Admin />} />
            <Route path='/launches' element={<Launches />} />
            <Route path='/launches/:launchid' element={<LaunchRoute />}>
              <Route index element={<LaunchHome />} />
              <Route path='*' element={<Launch />} />
            </Route>
          </Route>
        </Routes>
      </LaunchProvider>
    </AuthUserProvider>
  );
}
