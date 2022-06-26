import React from 'react';
import { FCLinkButton } from '../common/FCLinkButton';
import { APPNAME } from './App';

export default function Welcome() {
  return (
    <>
      <h1 className='m-4'>Welcome to {APPNAME}</h1>

      <p>
        Pretend there's useful content here, and then head over to ...
        <FCLinkButton className='d-block my-3' to='/launches'>Launches</FCLinkButton>
      </p>
    </>
  );
}
