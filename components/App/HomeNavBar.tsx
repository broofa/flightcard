import React from 'react';
import { Navbar } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { APPNAME } from './App';
import { ErrorFlash } from '/components/common/ErrorFlash';
import { auth } from '/rt';

const logoImage = require('/art/logo.svg');

export function HomeNavBar() {
  return (
    <>
      <Navbar
        bg='dark'
        variant='dark'
        className='position-sticky top-0'
        style={{ zIndex: 3 }}
      >
        <img src={logoImage} style={{ height: '2.5em', alignItem: 'center' }} />
        <div className='flex-grow-1'>{APPNAME}</div>
        <NavLink to='' className='p-2' onClick={() => auth.signOut()}>
          Log Out
        </NavLink>
      </Navbar>

      <div className='p-3' style={{ minHeight: 'calc(100vh - 38px - 65px)' }}>
        <Outlet />
        <ErrorFlash />
      </div>
    </>
  );
}
