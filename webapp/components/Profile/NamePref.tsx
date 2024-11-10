import React, { type InputHTMLAttributes } from 'react';
import { ATTENDEE_PATH, type AttendeeFields } from '/rt/rtconstants';
import { rtuiFromPath } from '../rtui/RTUI';

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
