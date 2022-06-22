import React, { HTMLAttributes } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { util } from '/rt';
import { USER_UNITS } from '/rt/rtconstants';
import { tUnitSystemName } from '/util/units';

export default function UnitsPref({
  authId,
  ...props
}: { authId: string } & HTMLAttributes<HTMLDivElement>) {
  const rtpath = USER_UNITS.with({ authId });
  const [units] = util.useValue<string>(rtpath);

  function setUnits(unitsName: tUnitSystemName) {
    util.set(rtpath, unitsName);
  }

  return (
    <ToggleButtonGroup
      name='units'
      value={units}
      type='radio'
      onChange={val => {
        setUnits(val);
      }}
      {...props}
    >
      <ToggleButton
        variant='outline-primary'
        size='sm'
        id='unit-mks'
        value='mks'
      >
        Metric
      </ToggleButton>
      <ToggleButton
        variant='outline-primary'
        size='sm'
        id='unit-uscs'
        value='uscs'
      >
        English
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
