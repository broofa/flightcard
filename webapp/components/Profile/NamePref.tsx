import type { InputHTMLAttributes } from 'react';
import { rtuiFromPath } from '../rtui/RTUI';
import { ATTENDEE_PATH, type AttendeeFields } from '/rt/rtconstants';

export default function ProfileName({
  attendeeFields,
  ...props
}: {
  attendeeFields: AttendeeFields;
} & InputHTMLAttributes<HTMLInputElement>) {
  const rtui = rtuiFromPath(ATTENDEE_PATH.with(attendeeFields));

  return (
    <>
      <h2>Name</h2>
      <rtui.StringInput label='Name' field='name' {...props} />
    </>
  );
}
