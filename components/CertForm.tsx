import React, { useState } from 'react';
import { useHistory } from 'react-router';
import { db, DELETE } from '../firebase';
import { iAttendee } from '../types';
import { CertDot } from './CertDot';
import Editor from './Editor';
import { tChildren } from './util';

export default function CertForm({ user, launchId } : { user : iAttendee; launchId : string; }) {
  const CERTS = {
    none: { level: 0 },
    NAR1: { type: 'nar', level: 1 },
    NAR2: { type: 'nar', level: 2 },
    NAR3: { type: 'nar', level: 3 },
    TRA1: { type: 'tra', level: 1 },
    TRA2: { type: 'tra', level: 2 },
    TRA3: { type: 'tra', level: 3 }
  };

  const currentCert = Object.keys(CERTS).find(c =>
    CERTS[c].type == user.cert?.type &&
    CERTS[c].level == user.cert?.level);

  const [selectedCert, setSelectedCert] = useState(currentCert ?? 'none');
  const history = useHistory();

  function onSave() {
    const cert = CERTS[selectedCert];
    if (!cert) return;
    db.attendee.updateChild(launchId, user.id, 'cert',
      { ...cert, verifiedDate: DELETE, verifiedId: DELETE });

    history.goBack();
  }

  function CertInput({ certName, children } : { certName : string; children ?: tChildren; }) {
    const cert = CERTS[certName];
    return <label>
      <input type='radio' className='me-2' onChange={() => setSelectedCert(certName)} checked={certName == selectedCert} />
      <CertDot cert={{ ...cert, verifiedDate: '-' }} showType className='me-4' />
      {children}
    </label>;
  }

  return <Editor onSave={onSave} onCancel={() => history.goBack()}>
    <h2>Certification</h2>

    <p>Please select your high power certification:</p>
    <p>
      <CertInput certName='none'>I'm not certified</CertInput>
    </p>

    <h3>National Association of Rocketry</h3>
    <p>
      <CertInput certName='NAR1' />
      <CertInput certName='NAR2' />
      <CertInput certName='NAR3' />
    </p>

    <h3>Tripoli Rocketry Association</h3>
    <p>
      <CertInput certName='TRA1' />
      <CertInput certName='TRA2' />
      <CertInput certName='TRA3' />
    </p>
  </Editor>;
}
