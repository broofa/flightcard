import React, { type HTMLAttributes } from 'react';
import { Image } from 'react-bootstrap';

import FIRE_IMG from '/art/fire.gif';

export function Sparky(props: HTMLAttributes<HTMLImageElement>) {
  return <Image src={FIRE_IMG} {...props} />;
}
