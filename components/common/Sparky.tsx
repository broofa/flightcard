import React, { HTMLAttributes } from 'react';
import { Image } from 'react-bootstrap';
import { fire } from '../Cards/MotorDetail';

export function Sparky(props: HTMLAttributes<HTMLImageElement>) {
  return <Image src={fire} {...props} />;
}
