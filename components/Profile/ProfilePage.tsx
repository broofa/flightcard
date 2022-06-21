import React, { ChangeEvent } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { tUnitSystemName } from '../../util/units';
import { useCurrentUser } from '../contexts/CurrentUserContext';
import { useLaunch } from '../contexts/LaunchContext';
import { OFFICERS } from '../Launch/UsersPane';
import CertForm from './CertForm';
import ProfileName from './ProfileName';
import UnitsPref from './UnitsPref';
import {
  AttendeesLink,
  busy,
  LinkButton,
  Loading,
} from '/components/common/util';
import { auth, db, DELETE } from '/rt';
import { iAttendee } from '/types';

export default function ProfilePage({
  user,
  launchId,
}: {
  user: iAttendee;
  launchId: string;
}) {
  const [currentUser] = useCurrentUser();
  const [launch] = useLaunch();

  function setUnits(units: tUnitSystemName) {
    db.user.update(currentUser?.id, { units });
  }

  if (!user) return <Loading wat='Attendee' />;
  if (!launch) return <Loading wat='Launch' />;

  const { cert } = user;


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
      <h1>Settings for {user?.name ?? <i>(unnamed user)</i>}</h1>

      <h2>Profile</h2>

      <ProfileName attendeeFields={{ launchId, userId: user.id }} />

      <h2>
        High-Power Certification{' '}
        {cert?.verifiedTime ? <span>({'\u2705'} Verified)</span> : null}
      </h2>

      <CertForm launchId={launch.id} userId={user.id} />

      <h2>Units of Measure</h2>

      <UnitsPref authId={user.id} />

      <h2>Actions</h2>
      <div className='d-flex flex-wrap gap-3 mb-3'>
        <LinkButton to={'/'}>Other Launches&hellip;</LinkButton>
        {currentUser?.id == 'ToMOmSnv7XVtygKOF9jjtwz0Kzs2' ? (
          <LinkButton to={'/admin'}>Admin</LinkButton>
        ) : null}
        <div className='flex-grow-1' />
        <Button variant='danger' tabIndex={-1} onClick={() => auth.signOut()}>
          Logout
        </Button>
      </div>
    </>
  );
}
