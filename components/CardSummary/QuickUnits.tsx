import React from 'react';
import UnitsPref from '/components/Profile/UnitsPref';
import { useCurrentAttendee } from '/components/contexts/rt_hooks';

export function QuickUnits() {
  const [attendee] = useCurrentAttendee();
  if (!attendee) return null;
  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: '4em',
        zIndex: 999,
        backgroundColor: '#fff',
      }}
    >
      <UnitsPref authId={attendee.id} className='mt-1 me-1' />
      <div style={{ fontSize: '9pt', textAlign: 'center', color: 'gray' }}>
        Units
      </div>
    </div>
  );
}
