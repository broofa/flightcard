import React from 'react';
import { Navbar } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { auth } from '/rt';
import { APPNAME } from './App';

import LOGO_FC from '/art/logo.svg';

export function HomeNavBar() {
  return (
    <>
      <Navbar
        bg='dark'
        variant='dark'
        className='position-sticky top-0'
        style={{ zIndex: 3 }}
      >
        <NavLink to='/launches' className='text-center p-1'>
          <img src={LOGO_FC} style={{ height: '2.5em' }} />
        </NavLink>
        <div className='flex-grow-1'>{APPNAME}</div>
        <NavLink to='' className='p-2' onClick={() => auth.signOut()}>
          Log Out
        </NavLink>
      </Navbar>

      <div className='p-3'>
        <Outlet />
      </div>
    </>
  );
}
