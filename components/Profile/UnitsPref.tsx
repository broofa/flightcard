import React, { HTMLAttributes } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { rtSet, useRTValue } from '/rt';
import { USER_UNITS } from '/rt/rtconstants';
import { tUnitSystemName } from '/util/units';

export default function UnitsPref({
  authId,
  ...props
}: { authId: string } & HTMLAttributes<HTMLDivElement>) {
  const rtpath = USER_UNITS.with({ authId });
  const [units] = useRTValue<string>(rtpath);

  function setUnits(unitsName: tUnitSystemName) {
    rtSet(rtpath, unitsName);
  }

  return (
    <ToggleButtonGroup
      {...props}
      name='units'
      value={units}
      type='radio'
      onChange={val => {
        setUnits(val);
      }}
    >
      <ToggleButton
        variant='outline-primary'
        size='sm'
        id='unit-mks'
        value='mks'
        style={{ fontSize: '1.4em', lineHeight: '1.4em', padding: '0 0.5em' }}
      >
        <span className='no-invert'>{'\u{1F30E}'}</span>
      </ToggleButton>
      <ToggleButton
        variant='outline-primary'
        size='sm'
        id='unit-uscs'
        value='uscs'
        style={{ fontSize: '2em', lineHeight: '0.9em', padding: '0 0.2em' }}
      >
        <span className='no-invert'>{'\u{1F1FA}\u{1F1F8}'}</span>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
