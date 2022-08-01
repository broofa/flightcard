import React from 'react';
import { Alert, Nav, Navbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { useLaunch } from '../contexts/LaunchContext';
import { useCurrentUser } from '../contexts/rthooks';
import { APPNAME } from './App';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';
import { auth } from '/rt';

export function LaunchNavBar() {
  const [launch, loading, error] = useLaunch();
  const [currentUser] = useCurrentUser();

  if (loading) {
    return <Loading wat='Launch (navbar)' />;
  } else if (error) {
    return <Alert variant='danger'>LaunchRoute: {error.message}</Alert>;
  } else if (!launch) {
    return <Alert variant='warning'>Launch Not Found</Alert>;
  }

  return (
    <div>
      <Navbar bg='dark' variant='dark' className='position-sticky top-0' style={{ zIndex: 3 }}>
        {currentUser && launch ? (
          <>
            {[
              ['', 'house-fill'],
              ['cards', 'card-fill'],
              ['rso', 'ui-checks'],
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
            <LinkContainer className='ms-2' to={'/launches'}>
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
    </div>
  );
}
