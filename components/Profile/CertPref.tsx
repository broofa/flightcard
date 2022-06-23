import React, { ChangeEvent } from 'react';
import { DELETE, rtSet, useRTValue } from '/rt';
import { ATTENDEE_CERT_PATH } from '/rt/rtconstants';
import { CertLevel, CertOrg, iCert } from '/types';

const CERT: Record<string, iCert> = {
  'NAR 1': { organization: CertOrg.NAR, level: CertLevel.L1 },
  'NAR 2': { organization: CertOrg.NAR, level: CertLevel.L2 },
  'NAR 3': { organization: CertOrg.NAR, level: CertLevel.L3 },
  'TRA 1': { organization: CertOrg.TRA, level: CertLevel.L1 },
  'TRA 2': { organization: CertOrg.TRA, level: CertLevel.L2 },
  'TRA 3': { organization: CertOrg.TRA, level: CertLevel.L3 },
};

function certKey(cert?: iCert) {
  if (!cert?.organization || !cert?.level) return;
  return `${cert.organization} ${cert.level ?? '0'}`;
}

export default function CertPref({
  launchId,
  userId,
}: {
  launchId: string;
  userId: string;
}) {
  const rtPath = ATTENDEE_CERT_PATH.with({ launchId, userId });
  const [cert] = useRTValue<iCert>(rtPath);
  function onCertChange(e: ChangeEvent<HTMLSelectElement>) {
    const { value } = e.target;
    const newCert = CERT[value];
    if (cert?.verifiedTime && cert?.level) {
      const okay = confirm(
        "You'll need to re-verify your NAR / TRA membership with a club officer if you do this?\nContinue?"
      );
      if (!okay) return;
    }
    rtSet(rtPath, newCert ?? DELETE);
  }

  return (
    <select
      className='form-select'
      value={certKey(cert)}
      onChange={onCertChange}
    >
      <option key='cert-none' value={''}>
        Not Certified
      </option>
      {Object.entries(CERT).map(([key, cert]) => (
        <option key={`cert-${key}`} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
}
