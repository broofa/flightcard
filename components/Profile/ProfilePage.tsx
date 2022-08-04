import React from 'react';
import { Alert } from 'react-bootstrap';
import { useCurrentAttendee, useLaunch } from '../contexts/rthooks';
import { OFFICERS } from '../Launch/UsersPane';
import CertPref from './CertPref';
import ProfileName from './ProfileName';
import UnitsPref from './UnitsPref';
import { AttendeesLink, LinkButton, Loading } from '/components/common/util';

export default function ProfilePage() {
  const [launch] = useLaunch();
  const [attendee] = useCurrentAttendee();

  if (!attendee) return <Loading wat='Attendee' />;
  if (!launch) return <Loading wat='Launch' />;

  const { cert } = attendee;

  // Compose certification status
  let certStatus;
  switch (true) {
    case cert?.level ?? -1 < 0: {
      certStatus = (
        <Alert className='py-1 mb-1' variant='danger'>
          Please indicate your high-power certification level. (If you are both
          NAR and TRA certified, select the one most appropriate for this
          launch.)
        </Alert>
      );
      break;
    }

    case (cert?.level ?? -1) >= 1 && !cert?.verifiedTime: {
      certStatus = (
        <Alert className='py-1 mb-1' variant='warning'>
          Show your certification card to a{' '}
          <AttendeesLink filter={OFFICERS} launchId={launch.id}>
            launch officer
          </AttendeesLink>{' '}
          to complete this step.
        </Alert>
      );
      break;
    }
  }

  return (
    <>
      <h1>Settings for {attendee?.name ?? <i>(unnamed user)</i>}</h1>

      <h2>Profile</h2>

      <ProfileName
        attendeeFields={{ launchId: launch.id, userId: attendee.id }}
      />

      <h2>
        High-Power Certification{' '}
        {cert?.verifiedTime ? <span>({'\u2705'} Verified)</span> : null}
      </h2>

      <CertPref launchId={launch.id} userId={attendee.id} />

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
