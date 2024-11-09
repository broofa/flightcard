import React from 'react';
import { useLaunch } from '../contexts/rt_hooks';
import './Stats.scss';
import { AttendeesByCert } from './widgets/AttendeesByCert';
import LCOActivity from './widgets/LCOActivity';
import { MotorsByClass } from './widgets/MotorsByClass';
import { MotorsByManufacturer } from './widgets/MotorsByManufacturer';
import RSOActivity from './widgets/RSOActivity';

export default function Stats() {
  const [launch] = useLaunch();
  return (
    <>
      <h1>{launch?.name ?? '(untitled)'} Launch Stats</h1>
      <div className='deck'>
        <AttendeesByCert />
        <MotorsByClass />
        <MotorsByManufacturer />
        <RSOActivity />
        <LCOActivity />
      </div>
    </>
  );
}
