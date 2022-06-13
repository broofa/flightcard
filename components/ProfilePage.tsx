import React, { useContext } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { AppContext } from './App/App';
import CertForm from '/components/CertForm';
import FloatingInput from '/components/common/FloatingInput';
import { AttendeesLink, busy, LinkButton, Loading } from '/components/common/util';
import { OFFICERS } from '/components/Launch';
import { auth, db, DELETE } from '/firebase';
import { iAttendee } from '/types';
import { tUnitSystemName } from '../util/units';

export default function ProfilePage({
  user,
  launchId,
}: {
  user: iAttendee;
  launchId: string;
}) {
  const { currentUser, launch } = useContext(AppContext);

  function setUnits(units: tUnitSystemName) {
    db.user.update(currentUser?.id, { units });
  }

  if (!user) return <Loading wat='Attendee' />;
  if (!launch) return <Loading wat='Launch' />;

  const { cert } = user;

  const onName = e => {
    let name = e?.target?.value;
    if (!name) name = DELETE;
    busy(
      e.target,
      Promise.all([
        db.attendee.update(launchId, user.id, { name }),
        db.user.update(user.id, { name }),
      ])
    );
  };

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

      <div className='ms-3'>
        {!user?.name ? (
          <Alert className='mb-1 py-1' variant='warning'>
            Please provide your name. (Names are important at in-person events
            like this.)
          </Alert>
        ) : null}
        <FloatingInput defaultValue={user.name ?? ''} onBlur={onName}>
          <label>
            Your Name
            <span className='ms-3 text-tip'>
              {' '}
              (as shown on your NAR / TRA card, if applicable)
            </span>
          </label>
        </FloatingInput>
      </div>

      <h2>
        High-Power Certification{' '}
        {cert?.verifiedTime ? <span>({'\u2705'} Verified)</span> : null}
      </h2>

      <CertForm user={user} launchId={launchId} />

      <h2>Units of Measure</h2>
      <div className='ms-3'>
        <p>
          Values for length, mass, force, etc. will be shown in these units:
        </p>
        <div>
          <input
            id='mksUnits'
            checked={currentUser?.units == 'mks'}
            className='me-2'
            type='radio'
            onChange={() => setUnits('mks')}
          />
          <label htmlFor='mksUnits'>Metric (Meters, Kilograms, Newtons)</label>
        </div>
        <div>
          <input
            id='uscsUnits'
            checked={currentUser?.units == 'uscs'}
            className='me-2'
            type='radio'
            onChange={() => setUnits('uscs')}
          />
          <label htmlFor='uscsUnits'>
            Imperial (Feet, Pounds, Pounds-Force)
          </label>
        </div>
      </div>

      <h2>Actions</h2>
      <div className='d-flex flex-wrap gap-3 mb-3 ms-3'>
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
