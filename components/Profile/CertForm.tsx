import React from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { util } from '/rt';
import { ATTENDEE_CERT_PATH } from '/rt/rtconstants';
import { CertLevel, CertOrg, iCert } from '/types';

const CERT: Record<string, iCert> = {
  NAR1: { organization: CertOrg.NAR, level: CertLevel.L1 },
  NAR2: { organization: CertOrg.NAR, level: CertLevel.L2 },
  NAR3: { organization: CertOrg.NAR, level: CertLevel.L3 },
  TRA1: { organization: CertOrg.TRA, level: CertLevel.L1 },
  TRA2: { organization: CertOrg.TRA, level: CertLevel.L2 },
  TRA3: { organization: CertOrg.TRA, level: CertLevel.L3 },
};

function certString(cert?: iCert) {
  return `${cert?.organization ?? ''} ${cert?.level ?? '0'}`;
}

function CertButton({ cert }: { cert: iCert }) {
  const certname = certString(cert);
  return (
    <ToggleButton variant='outline-secondary' id={certname} value={certname}>
      {certname}
    </ToggleButton>
  );
}

export default function CertForm({
  launchId,
  userId,
}: {
  launchId: string;
  userId: string;
}) {
  const rtPath = ATTENDEE_CERT_PATH.with({ launchId, userId });
  const [cert] = util.useValue<iCert>(rtPath);
  const certname = certString(cert);
  console.log(rtPath, cert, certname);
  return (
    <>
      <ToggleButtonGroup
        onChange={console.log}
        name='user_cert'
        type='radio'
        style={{ width: '15em' }}
        value={certname}
      >
        <CertButton cert={CERT.NAR1} />
        <CertButton cert={CERT.NAR2} />
        <CertButton cert={CERT.NAR3} />
      </ToggleButtonGroup>
      <br />
      <ToggleButtonGroup
        onChange={console.log}
        className='mt-2'
        name='user_cert'
        type='radio'
        style={{ width: '15em' }}
        value={certname}
      >
        <CertButton cert={CERT.TRA1} />
        <CertButton cert={CERT.TRA2} />
        <CertButton cert={CERT.TRA3} />
      </ToggleButtonGroup>
    </>
  );
}
