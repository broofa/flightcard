import type { HTMLAttributes } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { DELETE, rtSet, useRTValue } from '/rt';
import { ATTENDEE_ROLE_PATH } from '/rt/rtconstants';
import type { tRole } from '/types';

export default function RolePref({
  launchId,
  userId,
  ...props
}: { launchId: string; userId: string } & HTMLAttributes<HTMLDivElement>) {
  const rtpath = ATTENDEE_ROLE_PATH.with({ launchId, userId });
  const [role] = useRTValue<string>(rtpath);

  function setRole(role: tRole | '') {
    rtSet(rtpath, role || DELETE);
  }

  return (
    <ToggleButtonGroup
      name='role-pref'
      value={role ?? ''}
      type='radio'
      onChange={(val) => {
        setRole(val);
      }}
      {...props}
    >
      {[
        ['Off Duty', ''],
        ['RSO', 'rso'],
        ['LCO', 'lco'],
      ].map(([name, value]) => (
        <ToggleButton
          variant='outline-primary'
          className='flex-fill'
          size='sm'
          id={`role-pref-${value}`}
          value={value}
          style={{ minWidth: '6em' }}
          key={`role-${value}`}
        >
          {name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
