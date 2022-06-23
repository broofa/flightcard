import React, { ChangeEvent, HTMLAttributes, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { arraySort } from '../util/arrayUtils';
import { ANONYMOUS } from './App/App';
import { useLaunch } from './contexts/LaunchContext';
import { useRoleAPI } from './contexts/OfficersContext';
import { useAttendees, useCurrentUser, useOfficers } from './contexts/rthooks';
import { CertDot } from '/components/common/CertDot';
import { Loading } from '/components/common/util';
import { DELETE, rtRemove, rtSet, rtUpdate, useRTValue } from '/rt';
import {
  ATTENDEE_CERT_PATH,
  ATTENDEE_PATH,
  OFFICER_PATH,
} from '/rt/rtconstants';
import { iAttendee, iCert, iPerm } from '/types';

export function AttendeeInfo({
  attendee,
  isOfficer,
  className,
  hidePhoto,
  ...props
}: {
  attendee: iAttendee;
  isOfficer?: boolean;
  hidePhoto?: boolean;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`d-flex align-items-center ${className ?? ''}`} {...props}>
      {attendee.photoURL && !hidePhoto && (
        <img src={attendee.photoURL} style={{ height: '48px' }} />
      )}
      <span className='flex-grow-1 ms-2 my-0 h3'>
        {attendee?.name ?? ANONYMOUS}
      </span>

      {!isOfficer ? null : attendee.role ? (
        <span className='ms-2 ms-1 px-1 bg-info text-white'>
          {attendee.role?.toUpperCase()}
        </span>
      ) : (
        <span className={'ms-2  ms-1 px-1'}>{'\u2605'}</span>
      )}

      <CertDot className='ms-2 flex-grow-0' cert={attendee.cert} />
    </div>
  );
}

export type UserFilterFunction =
  | (() => boolean)
  | ((user: iAttendee) => boolean)
  | ((user: iAttendee, perm: iPerm) => boolean);

function UserEditor({
  launchId,
  userId,
  onHide,
}: {
  launchId: string;
  userId: string;
  onHide: () => void;
}) {
  const [currentUser] = useCurrentUser();
  const roleApi = useRoleAPI();
  const isOfficer = roleApi.isOfficer(userId);
  const rtFields = { launchId, userId };

  const [user] = useRTValue<iAttendee>(ATTENDEE_PATH.with(rtFields));

  if (!user) return <Loading wat='User' />;
  if (!currentUser) return <Loading wat='Current user' />;

  const onVerify = function (e: ChangeEvent<HTMLInputElement>) {
    const cert = {
      // Properties to update
      verifiedId: e.target.checked ? currentUser.id : DELETE,
      verifiedTime: e.target.checked ? Date.now() : DELETE,
    };

    return rtUpdate<iCert>(ATTENDEE_CERT_PATH.with(rtFields), cert);
  };

  const onOfficerToggle = async function (e: ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      await rtSet<boolean>(OFFICER_PATH.with(rtFields), true);
    } else {
      await rtRemove(OFFICER_PATH.with(rtFields));
    }
  };

  return (
    <Modal size='lg' show={true} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          {user.name || ANONYMOUS}{' '}
          <CertDot className='ms-4 flex-grow-1' cert={user.cert} showType />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Switch
          inline
          id={'verified'}
          className='ms-2'
          label='Certification verified'
          onChange={onVerify}
          disabled={(user.cert?.level ?? 0) <= 0}
          checked={!!user?.cert?.verifiedTime}
        />

        <Form.Switch
          id={'officer'}
          className='ms-2 mt-4'
          label='Club officer (RSO / LCO qualified)'
          onChange={onOfficerToggle}
          checked={isOfficer ?? false}
        />
      </Modal.Body>
    </Modal>
  );
}

export function UserList({
  launchId,
  filter,
  children,
  ...props
}: {
  launchId: string;
  filter?: UserFilterFunction;
} & HTMLAttributes<HTMLDivElement>) {
  const [editUserId, setEditUserId] = useState<string>();
  const [launch] = useLaunch();
  const [attendees] = useAttendees();
  const [officers] = useOfficers();

  if (!launch) {
    return <Loading wat='User launch' />;
  }
  if (!attendees) {
    return <Loading wat='Attendees' />;
  }

  return (
    <>
      <h2 className='d-flex'>{children}</h2>

      {editUserId ? (
        <UserEditor
          launchId={launchId}
          userId={editUserId}
          onHide={() => setEditUserId(undefined)}
        />
      ) : null}

      <div className='deck' {...props}>
        {arraySort(Object.values(attendees), 'name').map(attendee => {
          const isOfficer = !!officers?.[attendee.id];
          if (filter && !filter(attendee, isOfficer)) {
            return null;
          }

          const { id } = attendee;

          return (
            <Button
              key={id}
              variant='outline-dark text-start'
              className={`d-flex flex-grow-1 align-items-center ${
                attendee.photoURL ? 'ps-0 py-0' : ''
              }`}
              onClick={() => setEditUserId(attendee.id)}
            >
              <AttendeeInfo
                attendee={attendee}
                isOfficer={isOfficer}
                className='flex-grow-1'
              />
            </Button>
          );
        })}
      </div>
    </>
  );
}
