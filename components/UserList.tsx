import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { db, DELETE } from '../firebase';
import { iAttendee, iCert, iPerm } from '../types';
import { errTrap, useCurrentUser } from './App';
import { CertDot } from './CertDot';
import { Loading, sortArray, tChildren, tProps } from './util';

export type UserFilterFunction =
  (() => boolean) |
  ((user : iAttendee) => boolean) |
  ((user : iAttendee, isOfficer : iPerm) => boolean);

function UserEditor(
  { launchId, userId, onHide }
    : {launchId : string, userId : string, onHide : () => void }
) {
  const [currentUser] = useCurrentUser();
  const isOfficer = db.officer.useValue(launchId, userId);
  const user = db.attendee.useValue(launchId, userId);

  if (!user) return <Loading wat='User' />;
  if (!currentUser) return <Loading wat='Current user' />;

  const onVerify = function(e : any) {
    const cert = { // Properties to update
      verifiedId: e.target.checked ? currentUser.id : DELETE,
      verifiedDate: e.target.checked ? new Date().toISOString() : DELETE
    };

    db.attendee.updateChild<iCert>(launchId, user.id, 'cert', cert);
  };

  const onOfficerToggle = async function(e) {
    await db.officer.set(launchId, user.id, e.target.checked || DELETE);
  };

  return <Modal size='lg' show={true} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{user.name || '(anonymous)'} <CertDot className='ml-4' cert={user.cert} expand={true}/></Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Switch id={'verified'}
        className='ml-2'
        label='Certification verified'
        onChange={onVerify}
        disabled={(user.cert?.level ?? 0) <= 0}
        checked={!!user?.cert?.verifiedDate} />

        <Form.Switch id={'officer'}
          className='ml-2 mt-4'
          label='Can perform RSO or LCO duties'
          disabled={(user.cert?.level ?? 0) <= 1}
          onChange={errTrap(onOfficerToggle)}
          checked={isOfficer ?? false} />
      </Modal.Body>
    </Modal>;
}

export function UserList(
  { launchId, filter, children, ...props } : {
    launchId : string;
    filter ?: UserFilterFunction;
    children : tChildren;
  } & tProps) {
  const [editUserId, setEditUserId] = useState<string>();
  const attendees = db.attendees.useValue(launchId);
  const officers = db.officers.useValue(launchId);
  const launch = db.launch.useValue(launchId);

  if (!launch) { return <Loading wat='User launch' />; }
  if (!attendees) { return <Loading wat='Launch users' />; }
  if (!officers) { return <Loading wat='Perms' />; }

  return <>
    <h2 className='d-flex mt-4'>{children}</h2>

    {editUserId ? <UserEditor launchId={launchId} userId={editUserId} onHide={() => setEditUserId(undefined)} /> : null}

    <div className='deck' {...props}>
      {
        sortArray(Object.values(attendees), 'name')
          .map(attendee => {
            const isOfficer = officers[attendee.id];
            if (filter && !filter(attendee, isOfficer)) { return null; }

            const { id, name } = attendee;

            return <Button key={id}
              variant='outline-dark text-left'
              className={`d-flex flex-grow-1 align-items-center ${attendee.photoURL ? 'pl-0 py-0' : ''}`}
              onClick={() => setEditUserId(attendee.id)}>
              {
                attendee.photoURL && <img src={attendee.photoURL} style={{ height: '48px' }}/>
              }
              <span className='flex-grow-1 ml-2'>{name}</span>

              {
                !isOfficer
                  ? null
                  : attendee.role
                    ? <span className='ml-2 my-2 ml-1 px-1 bg-info rounded-lg text-white'>{attendee.role?.toUpperCase()}</span>
                    : <span className={'ml-2 my-2 ml-1 px-1'}>{'\u2605'}</span>
              }
              <CertDot className='ml-2 flex-grow-0' cert={attendee.cert} />
            </Button>;
          })}
    </div>
  </>;
}
