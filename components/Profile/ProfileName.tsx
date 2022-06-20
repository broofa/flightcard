import React, { InputHTMLAttributes } from 'react';
import { rtuiFromPath } from '../rtui/RTUI';
import { AttendeeFields, ATTENDEE_PATH } from '/firebase';

export default function ProfileName({
  attendeeFields,
  ...props
}: {
  attendeeFields: AttendeeFields;
} & InputHTMLAttributes<HTMLInputElement>) {
  const rtui = rtuiFromPath(ATTENDEE_PATH.append('name').with(attendeeFields));

  return <rtui.StringInput label='Name' field='name' {...props} />;
}
