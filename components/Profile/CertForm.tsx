import React, { Attributes, useEffect, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { AttendeeFields, ATTENDEE_PATH, util } from '/firebase';
import { CertLevel, CertOrg, iCert } from '/types';

const CERT: Record<string, iCert> = {
  NAR1: { organization: CertOrg.NAR, level: CertLevel.L1 },
  NAR2: { organization: CertOrg.NAR, level: CertLevel.L2 },
  NAR3: { organization: CertOrg.NAR, level: CertLevel.L3 },
  TRA1: { organization: CertOrg.TRA, level: CertLevel.L1 },
  TRA2: { organization: CertOrg.TRA, level: CertLevel.L2 },
  TRA3: { organization: CertOrg.TRA, level: CertLevel.L3 },
};

function certString(cert: iCert) {
  return `${cert?.organization ?? ''}${cert?.level ?? '0'}`;
}

export default function CertForm({
  attendeeFields,
  ...props
}: {
  attendeeFields: AttendeeFields;
} & Attributes) {
  const rtPath = ATTENDEE_PATH.append('cert').with(attendeeFields);
  const [cert, setCert] = useState<iCert | null>();
  util.useSimpleValue<iCert>(rtPath, setCert);

  useEffect(() => {}, [attendeeFields]);

  return (
    <>
      <ToggleButtonGroup name='user_cert' type='radio'>
        <ToggleButton value='NAR1'>NAR 1</ToggleButton>
        <ToggleButton value='NAR1'>NAR 2</ToggleButton>
        <ToggleButton value='NAR1'>NAR 3</ToggleButton>
        <br />
        <ToggleButton value='TRA1'>TRA 1</ToggleButton>
        <ToggleButton value='TRA1'>TRA 2</ToggleButton>
        <ToggleButton value='TRA1'>TRA 3</ToggleButton>
      </ToggleButtonGroup>
    </>
  );
}
