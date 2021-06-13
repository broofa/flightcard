import React, { HTMLAttributes, useContext } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { auth, db, DELETE } from '../firebase';
import { iAttendee } from '../types';
import { tUnitSystemName } from '../util/units';
import { ANONYMOUS, AppContext } from './App';
import { CertDot } from './common/CertDot';
import FloatingInput from './common/FloatingInput';
import { AttendeesLink, busy, LinkButton, Loading } from './common/util';
import { OFFICERS } from './Launch';

export default function ProfilePage({ user, launchId } : { user : iAttendee; launchId : string; }) {
  const { currentUser, launch } = useContext(AppContext);

  function CertInput(
    { type, level, children, ...props } :
    {
      type ?: 'tra' | 'nar',
      level : 0 | 1 | 2 | 3
    } & HTMLAttributes<HTMLLabelElement>
  ) {
    function handleChange() {
      if (user.cert?.verifiedTime) {
        if (!confirm('You\'ll need to re-verify your certification with a launch officer if you make this change.  Continue?')) return;
      }
      db.attendee.updateChild(launchId, user.id, 'cert',
        { type: type ?? DELETE, level, verifiedTime: DELETE, verifiedId: DELETE });
    }

    return <label {...props}>
      <input type='radio' className='me-1' onChange={handleChange} checked={type == user.cert?.type && level == user.cert?.level} />
      {
        type
          ? <CertDot cert={{ type, level, verifiedTime: 999 }} showType className='me-4' />
          : null
      }
      {children}
    </label>;
  }

  function setUnits(units : tUnitSystemName) {
    db.user.update(currentUser?.id, { units });
  }

  if (!user) return <Loading wat='Attendee' />;
  if (!launch) return <Loading wat='Launch' />;

  const { cert } = user;

  const onName = e => {
    let name = e?.target?.value;
    if (!name || name == ANONYMOUS) name = DELETE;
    busy(e.target, Promise.all([
      db.attendee.update(launchId, user.id, { name }),
      db.user.update(user.id, { name })
    ]));
  };

  // Compose certification status
  let certStatus;
  switch (true) {
    case (cert?.level ?? -1 < 0): {
      certStatus = <Alert className='py-1 mb-1' variant='danger'>Please indicate your high-power certification level.  (If you are both NAR and TRA certified, select the one most appropriate for this launch.)</Alert>;
      break;
    }

    case ((cert?.level ?? -1) >= 1 && !cert?.verifiedTime): {
      certStatus = <Alert className='py-1 mb-1' variant='warning'>Show your certification card to a <AttendeesLink filter={OFFICERS} launchId={launch.id}>launch officer</AttendeesLink> to complete this step.</Alert>;
      break;
    }
  }

  return <>
    <h1>Settings for {user?.name ?? ANONYMOUS}</h1>

    <h2>Profile</h2>

    <div className='ms-3'>
      {
        !user?.name
          ? <Alert className='mb-1 py-1' variant='warning'>You are currently anonymous.  Please enter your name here.</Alert>
          : null
      }
      <FloatingInput defaultValue={user.name ?? ANONYMOUS} onBlur={onName}>
        <label>
          Your Name
          <span className='ms-3 small text-secondary'> (as shown on your NAR / TRA card, if applicable)
  </span>
        </label>
      </FloatingInput>
    </div>

    <h2>High-Power Certification {cert?.verifiedTime ? <span>({'\u2705'} Verified)</span> : null}</h2>

    <div className='ms-3'>
      {certStatus}

      <div className='d-grid' style={{ width: 'max-content', gap: '0.3em 1em', gridTemplateColumns: 'auto auto auto' }}>
        <CertInput level={0} style={{ gridColumn: 'span 3' }}>Not certified</CertInput>

        <CertInput type='nar' level={1} />
        <CertInput type='nar' level={2} />
        <CertInput type='nar' level={3} />

        <CertInput type='tra' level={1} />
        <CertInput type='tra' level={2} />
        <CertInput type='tra' level={3} />
      </div>
    </div>

    <h2>Units of Measure</h2>
    <div className='ms-3'>
      <p>Values for length, mass, force, etc. will be shown in these units:</p>
      <div>
        <input id='mksUnits' checked={currentUser?.units == 'mks'} className='me-2'
          type='radio' onChange={() => setUnits('mks')} />
        <label htmlFor='mksUnits'>Metric (Meters, Kilograms, Newtons)</label>
      </div>
      <div>
        <input id='uscsUnits' checked={currentUser?.units == 'uscs'} className='me-2'
          type='radio' onChange={() => setUnits('uscs')} />
        <label htmlFor='uscsUnits'>Imperial (Feet, Pounds, Pounds-Force)</label>
      </div>
    </div>

    <h2>Actions</h2>
    <div className='d-flex flex-wrap gap-3 mb-3 ms-3'>
      <LinkButton to={'/'} >Other Launches&hellip;</LinkButton>
      {
        currentUser?.id == 'ToMOmSnv7XVtygKOF9jjtwz0Kzs2'
          ? <LinkButton to={'/admin'} >Admin</LinkButton>
          : null
      }
      <div className='flex-grow-1'/>
      <Button variant='danger' tabIndex={-1} onClick={() => auth().signOut()}>Logout</Button>
    </div>
  </>;
}
