import UnitsPref from '/components/Profile/UnitsPref';
import { useCurrentAttendee } from '/components/contexts/rt_hooks';

export function QuickUnits() {
  const [attendee] = useCurrentAttendee();
  if (!attendee) return null;
  return (
    <div style={{ width: '6em' }}>
      <UnitsPref authId={attendee.id} className='mt-1 me-1' />
      <div style={{ fontSize: '9pt', textAlign: 'center', color: 'gray' }}>
        Units
      </div>
    </div>
  );
}
