import React from 'react';
import { FCLinkButton } from '../common/FCLinkButton';
import { APPNAME } from './App';

export default function Welcome() {
  return (
    <>
      <h1 className='m-4'>Welcome to {APPNAME}</h1>

      <p>
        We'll eventually have an introduction and documentation here. For now
        you should just head over to ...
        <FCLinkButton className='d-block my-3' to='/launches'>
          Launches
        </FCLinkButton>
      </p>
    </>
  );
}
