import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { auth, db, DELETE } from '../firebase';
import { iAttendee, tUnits } from '../types';
import { AppContext } from './App';
import { CertDot } from './CertDot';
import { tChildren, tProps } from './util';

export default function ProfilePage({ user, launchId } : { user : iAttendee; launchId : string; }) {
  const { currentUser } = useContext(AppContext);
  function CertInput({ type, level, children, ...props } : {
    type ?: 'tra' | 'nar',
    level : 0 | 1 | 2 | 3,
    children ?: tChildren;
  } & tProps) {
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

  function setUnits(units : tUnits) {
    units = units == 'uscs' ? units : DELETE;
    db.user.update(currentUser?.id, { units });
  }

  return <>
    <h2>High-Power Certification</h2>
    <div className='d-grid ps-3' style={{ width: 'max-content', gap: '0.3em 1em', gridTemplateColumns: 'auto auto auto' }}>
      <CertInput level={0} style={{ gridColumn: 'span 3' }}>Not certified</CertInput>

      <CertInput type='nar' level={1} />
      <CertInput type='nar' level={2} />
      <CertInput type='nar' level={3} />

      <CertInput type='tra' level={1} />
      <CertInput type='tra' level={2} />
      <CertInput type='tra' level={3} />
    </div>

    <h2>Display Units</h2>
    <div>
      <input id='mksUnits' checked={currentUser?.units != 'uscs'} className='me-2'
        type='radio' onChange={() => setUnits('mks')} />
      <label htmlFor='mksUnits'>MKS (Metric)</label>

      <input id='uscsUnits' checked={currentUser?.units == 'uscs'}className='ms-5 me-2'
        type='radio' onChange={() => setUnits('uscs')} />
      <label htmlFor='uscsUnits'>USCS (Imperial)</label>
    </div>

    <h2>Actions</h2>
    <div className='d-flex flex-wrap gap-3 mb-3 ms-3'>
      <LinkContainer to={'/'} ><Button>Other Launches&hellip;</Button></LinkContainer>
      {
        currentUser?.id == 'ToMOmSnv7XVtygKOF9jjtwz0Kzs2'
          ? <LinkContainer to={'/admin'} ><Button>Admin</Button></LinkContainer>
          : null
      }
      <div className='flex-grow-1'/>
      <Button variant='danger' onClick={() => auth().signOut()}>Logout</Button>
    </div>
  </>;
}
