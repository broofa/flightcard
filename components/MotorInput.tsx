import React, { useState } from 'react';
import MOTORS from 'thrustcurve-db';

for (const motor of (MOTORS as any[])) {
  motor._name = `${motor.manufacturerAbbrev} ${motor.designation}`;
  motor._query = motor._name.toLowerCase();
}

/**
 *
 * Component for searching for motor info on ThrustCurve.org
 */
export default function MotorInput(props) {
  const [query, setQuery] = useState(props.defaultValue ?? '');

  function handleChange(e) {
    setQuery(e.target.value.toLowerCase());
  }

  let motors = (MOTORS as any[]).filter(m => {
    return m._query.indexOf(query) >= 0;
  });
  if (motors.length > 10) {
    motors = motors.slice(0, 10);
  }

  let delays;
  if (motors.length === 1 && motors[0].delays) {
    const m = motors[0];
    delays = m.delays.split(/[-, ]+/g);
  }
  console.log(motors);

  return <>
    <input onChange={handleChange} list='motor-suggestions' {...props} />
    <input {...props} placeholder='Delay (seconds)'/>
    <datalist onClick={() => alert('click')} id='motor-suggestions'>
      {motors.map((m, i) => <option key={m._query} value={m._name} />)}
    </datalist>
  </>;
}
