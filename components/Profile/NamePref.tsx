import React, { InputHTMLAttributes } from 'react';
import { rtuiFromPath } from '../rtui/RTUI';
import { AttendeeFields, ATTENDEE_PATH } from '/rt/rtconstants';

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
