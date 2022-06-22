import React from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { DELETE, util } from '/rt';
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

function certKey(cert?: iCert) {
  if (!cert?.organization || !cert?.level) return '0';
  return `${cert.organization}${cert.level ?? '0'}`;
}
function certName(cert?: iCert) {
  return `${cert?.organization ?? ''} ${cert?.level ?? '0'}`;
}

export default function CertPref({
  launchId,
  userId,
}: {
  launchId: string;
  userId: string;
}) {
  const rtPath = ATTENDEE_CERT_PATH.with({ launchId, userId });
  const [cert] = util.useValue<iCert>(rtPath);

  function onCertChange(key: string) {
    const cert = CERT[key];
    console.log('SETTING', key, cert);
    util.set(rtPath, cert ?? DELETE);
  }

  const traCerts = Object.values(CERT).filter(
    cert => cert.organization === CertOrg.TRA
  );
  const narCerts = Object.values(CERT).filter(
    cert => cert.organization === CertOrg.NAR
  );

  return (
    <>
      <ToggleButtonGroup
        name='cert-pref'
        type='radio'
        value={certKey(cert)}
        className='d-flex'
        onChange={val => onCertChange(val)}
      >
        {narCerts.map(cert => (
          <ToggleButton
            variant='outline-primary'
            className='flex-fill'
            size='sm'
            id={`cert-pref-${certKey(cert)}`}
            key={`cert-pref-${certKey(cert)}`}
            value={certKey(cert)}
          >
            {certName(cert)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <br />
      <ToggleButtonGroup
        name='cert-pref'
        type='radio'
        value={certKey(cert)}
        className='d-flex'
        onChange={val => onCertChange(val)}
      >
        {traCerts.map(cert => (
          <ToggleButton
            variant='outline-primary'
            size='sm'
            id={`cert-pref-${certKey(cert)}`}
            key={`cert-pref-${certKey(cert)}`}
            value={certKey(cert)}
          >
            {certName(cert)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </>
  );
}
