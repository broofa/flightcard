import React from 'react';
import { Image } from 'react-bootstrap';
import { fire } from '../CardEditor/MotorDetail';

export function Sparky() {
  return <Image src={fire} className='m-auto' />;
}
