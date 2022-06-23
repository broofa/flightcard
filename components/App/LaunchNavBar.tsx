import React from 'react';
import { Alert, Nav, Navbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { useLaunch } from '../contexts/LaunchContext';
import { useCurrentUser } from '../contexts/rthooks';
import { APPNAME } from './App';
import { RangeStatus } from './RangeStatus';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';
import { auth, useRTValue } from '/rt';
import { ATTENDEE_PATH } from '/rt/rtconstants';
import { iAttendee } from '/types';

export function LaunchNavBar() {
  const [launch, loading, error] = useLaunch();
  const [currentUser] = useCurrentUser();
  const [attendee] = useRTValue<iAttendee>(
    ATTENDEE_PATH.with({
      launchId: launch?.id ?? '',
      userId: currentUser?.id ?? '',
    })
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
      <Navbar bg='dark' className='position-sticky top-0' style={{ zIndex: 3 }}>
        {currentUser && launch ? (
          <>
            {[
              ['', 'house-fill'],
              ['cards', 'card-fill'],
              ['rso', 'officer'],
              ['lco', 'rocket'],
              // ['users', 'people-fill'],
              // ['profile', 'gear-fill'],
            ].map(([path, icon]) => (
              <NavLink
                to={`/launches/${launch.id}/${path}`}
                key={path}
                className='flex-grow-1 text-center py-2'
              >
                {<Icon size='2em' name={icon} />}
              </NavLink>
            ))}
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

      <div className='p-3' style={{ minHeight: 'calc(100vh - 38px - 65px)' }}>
        <Outlet />
      </div>

      {launch ? (
        <RangeStatus
          className='position-sticky bottom-0 w-100 bg-light'
          launch={launch}
          isLCO={attendee?.role == 'lco'}
        />
      ) : null}
    </div>
  );
}
