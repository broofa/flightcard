import React, { HTMLAttributes } from 'react';
import MOTORS, { Motor } from 'thrustcurve-db';
import { arraySort } from '../../util/arrayUtils';
import { motorDisplayName } from '../../util/motor-util';

export function MotorDataList(props: HTMLAttributes<HTMLDataListElement>) {
  function sortKey(motor: Motor) {
    const { manufacturerAbbrev, commonName, availability } = motor;

    return (
      (availability === 'OOP' ? '1' : '0') +
      '-' +
      manufacturerAbbrev +
      '-' +
      commonName
    );
  }

  const motors = arraySort(MOTORS, sortKey);

  return (
    <datalist {...props}>
      {motors.map(m => (
        <option key={m.motorId} value={motorDisplayName(m)} />
      ))}
    </datalist>
  );
}
