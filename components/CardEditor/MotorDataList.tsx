import React from 'react';
import MOTORS from 'thrustcurve-db';
import { motorDisplayName } from '../../util/motor-util';
import { sortArray } from '../../util/sortArray';

export function MotorDataList(props) {
  function sortKey(motor) {
    const { manufacturerAbbrev, commonName, availability } = motor;

    return (
      (availability === 'OOP' ? '1' : '0') +
      '-' +
      manufacturerAbbrev +
      '-' +
      commonName
    );
  }

  const motors = sortArray(MOTORS, sortKey);

  return (
    <datalist {...props}>
      {motors.map(m => (
        <option key={m.motorId} value={motorDisplayName(m)} />
      ))}
    </datalist>
  );
}
