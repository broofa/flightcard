import React from 'react';
import { Alert, Navbar } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { useCurrentUser, useLaunch } from '../contexts/rt_hooks';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';

function NavBarLink({
  launchId,
  path,
  icon,
  label,
}: {
  launchId: string;
  path: string;
  icon?: string;
  label?: string;
}) {
  return (
    <NavLink
      to={`/launches/${launchId}/${path}`}
      key={path}
      className='flex-grow-1 text-center py-2'
    >
      {label ? label : <Icon size='2em' name={icon ?? ''} />}
    </NavLink>
  );
}

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
      <Navbar
        bg='dark'
        variant='dark'
        className='position-sticky top-0'
        style={{ zIndex: 3 }}
      >
        {currentUser && launch ? (
          <>
            <NavBarLink launchId={launch.id} path='' icon='house-fill' />
            <NavBarLink launchId={launch.id} path='cards' icon='card-fill' />
            <NavBarLink
              launchId={launch.id}
              path='lco'
              label='LCO'
              // icon='ui-checks'
            />
            <NavBarLink
              launchId={launch.id}
              path='rso'
              label='RSO'
              // icon='rocket'
            />
          </>
        ) : null}
      </Navbar>

      <div className='p-3' style={{ minHeight: 'calc(100vh - 38px - 65px)' }}>
        <Outlet />
      </div>
    </div>
  );
}
