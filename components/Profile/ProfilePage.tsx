import React from 'react';
import { useCurrentAttendee, useLaunch } from '../contexts/rthooks';
import CertPref from './CertPref';
import ProfileName from './NamePref';
import UnitsPref from './UnitsPref';
import { LinkButton, Loading } from '/components/common/util';
import { CertOrg } from '/types';
import { getCertVerified } from '/util/cert-util';

export default function ProfilePage() {
  const [launch] = useLaunch();
  const [attendee] = useCurrentAttendee();

  if (!attendee) return <Loading wat='Attendee' />;
  if (!launch) return <Loading wat='Launch' />;

  const isVerified = getCertVerified(attendee);

  return (
    <>
      <h1>Settings for {attendee?.name ?? <i>(unnamed user)</i>}</h1>

      <ProfileName
        style={{ width: '15em' }}
        attendeeFields={{ launchId: launch.id, userId: attendee.id }}
      />

      <h2>Certifications</h2>
      <CertPref
        attendeeFields={{ launchId: launch.id, userId: attendee.id }}
        org={CertOrg.TRA}
        className='mt-2'
      />

      <CertPref
        attendeeFields={{ launchId: launch.id, userId: attendee.id }}
        org={CertOrg.NAR}
        className='mt-2'
      />

      <h2>Units of Measure</h2>

      <UnitsPref authId={attendee.id} />

      <h2>Actions</h2>
      <div className='d-flex flex-wrap gap-3 mb-3'>
        <LinkButton to={'/launches'}>Other Launches&hellip;</LinkButton>
        {attendee?.id == 'ToMOmSnv7XVtygKOF9jjtwz0Kzs2' ? (
          <LinkButton to={'/admin'}>Admin</LinkButton>
        ) : null}
        <div className='flex-grow-1' />
      </div>
    </>
  );
}
