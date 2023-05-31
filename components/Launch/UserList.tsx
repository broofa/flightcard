import React, { ChangeEvent, HTMLAttributes, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { isMock } from '../Admin/MockDB';
import { ANONYMOUS } from '../App/App';
import { Warning } from '../common/Warning';
import { useIsOfficer, useRoleAPI } from '../contexts/OfficersContext';
import { useAttendees, useCurrentUser, useLaunch } from '../contexts/rthooks';
import { CertDot } from '/components/common/CertDot';
import { cn, Loading } from '/components/common/util';
import { DELETE, rtRemove, rtSet, rtUpdate, useRTValue } from '/rt';
import {
  ATTENDEE_NAR_CERT_PATH,
  ATTENDEE_PATH,
  ATTENDEE_TRA_CERT_PATH,
  OFFICER_PATH,
} from '/rt/rtconstants';
import { CertOrg, iAttendee, iCert, iPerm } from '/types';
import { arraySort } from '/util/arrayUtils';

export function AttendeeInfo({
  attendee,
  className,
  hidePhoto,
  ...props
}: {
  attendee: iAttendee;
  hidePhoto?: boolean;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const roleApi = useRoleAPI();

  return (
    <div className={cn(className, `d-flex align-items-center`)} {...props}>
      {attendee.photoURL && !hidePhoto && (
        <img src={attendee.photoURL} style={{ height: '48px' }} />
      )}
      <span className='flex-grow-1 ms-2 my-0 h3'>
        {attendee?.name ?? ANONYMOUS}
      </span>

      {!roleApi.isOfficer(attendee) ? null : attendee.role ? (
        <span className='ms-2 ms-1 px-1 bg-info text-white'>
          {attendee.role?.toUpperCase()}
        </span>
      ) : (
        <span className={'ms-2  ms-1 px-1'}>{'\u2605'}</span>
      )}

      <CertDot className='ms-2 flex-grow-0' attendee={attendee} />
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

  const [attendee] = useRTValue<iAttendee>(ATTENDEE_PATH.with(rtFields));

  if (!attendee) return <Loading wat='User' />;
  if (!currentUser) return <Loading wat='Current user' />;

  const onVerify = function (organization: CertOrg, verified: boolean) {
    const rtPath =
      organization === 'TRA'
        ? ATTENDEE_TRA_CERT_PATH.with(rtFields)
        : ATTENDEE_NAR_CERT_PATH.with(rtFields);

    const cert = {
      verifiedId: verified ? currentUser.id : DELETE,
      verifiedTime: verified ? Date.now() : DELETE,
    };

    return rtUpdate<iCert>(rtPath, cert);
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
        <Modal.Title>{attendee.name || ANONYMOUS} </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <h3>Certifications</h3>
        {Object.values(attendee.certs ?? []).map(cert => {
          const certLevel = cert.level;
          const certVerified = !!cert.verifiedId;

          return (
            <div
              key={cert.organization}
              className='card p-2 mb-2 ms-2'
              style={{ maxWidth: '25em' }}
            >
              <div className='d-flex'>
                <div className='d-flex flex-grow-1'>
                  {cert.organization} #{cert.memberId}
                </div>
                <div>Level {certLevel}</div>
              </div>

              <div className='d-flex'>
                <div className='flex-grow-1'>
                  {cert.firstName} {cert.lastName}
                </div>
                <div>
                  Expires {new Date(cert.expires ?? 0).toLocaleDateString()}
                </div>
              </div>

              <div className='d-flex'>
                <Form.Check
                  inline
                  id={`verified-${cert.organization}`}
                  className='flex-grow-1'
                  label={`Verified`}
                  onChange={() =>
                    onVerify(cert.organization ?? CertOrg.TRA, !certVerified)
                  }
                  checked={certVerified}
                />
                <span>
                  {cert.verifiedId ? '' : <Warning>Needs Verification</Warning>}
                </span>
              </div>
            </div>
          );
        })}

        <h3>Role</h3>
        <Form.Switch
          id={'officer'}
          className='ms-2'
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
  const isOfficer = useIsOfficer();
  const roleApi = useRoleAPI();

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
          if (filter && !filter(attendee, roleApi.isOfficer(attendee))) {
            return null;
          }

          const { id } = attendee;
          const attendeeInfo = (
            <AttendeeInfo attendee={attendee} className='flex-grow-1' />
          );

          return isOfficer ? (
            <Button
              key={id}
              variant='outline-dark'
              className={cn(
                `d-flex flex-grow-1 align-items-center text-start `,
                {
                  'ps-0 py-0': attendee.photoURL,
                  'mock-badge': isMock(attendee),
                }
              )}
              onClick={() => setEditUserId(attendee.id)}
            >
              {attendeeInfo}
            </Button>
          ) : (
            <div
              key={id}
              className={`p-2 bg-light rounded border border-light d-flex flex-grow-1 align-items-center text-start ${
                attendee.photoURL ? 'ps-0 py-0' : ''
              }`}
            >
              {attendeeInfo}
            </div>
          );
        })}
      </div>
    </>
  );
}
