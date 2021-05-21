import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { auth, db, DELETE } from '../firebase';
import { iAttendee } from '../types';
import { AppContext } from './App';
import { CertDot } from './CertDot';
import { tChildren } from './util';

export default function ProfilePage({ user, launchId } : { user : iAttendee; launchId : string; }) {
  const { currentUser } = useContext(AppContext);
  function CertInput({ type, level, children } : { type ?: 'tra' | 'nar', level : 0 | 1 | 2 | 3, children ?: tChildren; }) {
    function handleChange() {
      if (user.cert?.verifiedTime) {
        if (!confirm('You\'ll need to re-verify your certification with a launch officer if you make this change.  Continue?')) return;
      }
      db.attendee.updateChild(launchId, user.id, 'cert',
        { type: type ?? DELETE, level, verifiedTime: DELETE, verifiedId: DELETE });
    }

    return <label>
      <input type='radio' className='me-1' onChange={handleChange} checked={type == user.cert?.type && level == user.cert?.level} />
      {
        type
          ? <CertDot cert={{ type, level, verifiedTime: '-' }} showType className='me-4' />
          : null
      }
      {children}
    </label>;
  }

  return <>
    <h2>Actions</h2>
    <div className='d-flex flex-wrap gap-3 mb-3 ms-3'>
      <LinkContainer to={'/'} ><Button>Other Launches&hellip;</Button></LinkContainer>
      {
        currentUser?.id == 'onLzrICBjwXrvbdmwGl0M9rtlI63'
          ? <LinkContainer to={'/admin'} ><Button>Admin</Button></LinkContainer>
          : null
      }
      <div className='flex-grow-1'/>
      <Button variant='danger' onClick={() => auth().signOut()}>Logout</Button>
    </div>

    <h2>High-Power Certification</h2>
    <div className='d-flex flex-column gap-3 ps-3'>
      <div>
        <CertInput level={0}>Not certified</CertInput>
      </div>

      <div>
        <CertInput type='nar' level={1} />
        <CertInput type='nar' level={2} />
        <CertInput type='nar' level={3} />
      </div>

      <div>
        <CertInput type='tra' level={1} />
        <CertInput type='tra' level={2} />
        <CertInput type='tra' level={3} />
      </div>
    </div>
  </>;
}
