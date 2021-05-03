import React, { ReactNode, useState } from 'react';
import { Badge, Button, Form, Modal } from 'react-bootstrap';
import { db, DELETE } from '../firebase';
import { iCert, iLaunchUser, iPerm, tRole } from '../types';
import { useCurrentUser } from './App';
import { CertDot } from './CertDot';
import { Loading, sortArray, tChildren, tProps } from './util';

function RoleBadge({ role, user }) {
  return <span style={{ textTransform: 'uppercase' }} className={`ml-2 my-2 ml-1 px-1 ${user.role == role ? 'bg-info rounded-lg text-white' : ''}`}>{role}</span>;
}

export type UserFilterFunction =
  (() => boolean) |
  ((user : iLaunchUser) => boolean) |
  ((user : iLaunchUser, perm : iPerm) => boolean);

function UserEditor(
  { launchId, userId, onHide }
    : {launchId : string, userId : string, onHide : () => void }
) {
  const [currentUser] = useCurrentUser();
  const perm = db.launchPerm.useValue(launchId, userId);
  const user = db.launchUser.useValue(launchId, userId);

  if (!user) return <Loading wat='User' />;
  if (!currentUser) return <Loading wat='Current user' />;

  const onVerify = function(e : any) {
    const cert = { // Properties to update
      verifiedId: e.target.checked ? currentUser.id : DELETE,
      verifiedDate: e.target.checked ? new Date().toISOString() : DELETE
    };

    db.launchUser.updateChild<iCert>(launchId, user.id, 'cert', cert);
  };

  return <Modal size='lg' show={true} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{user.name || '(anonymous)'} <CertDot className='ml-4' cert={user.cert} expand={true}/></Modal.Title>
      </Modal.Header>

      <Modal.Body>

        <Form.Switch inline id={'verified'}
        className='ml-2'
        label='Certification verified'
        onChange={onVerify}
        disabled={(user.cert?.level ?? 0) <= 0}
        checked={!!user?.cert?.verifiedDate} />

        <h3 className='mt-3'>Qualified For:</h3>
        {
          (['lco', 'rso'] as tRole[]).map(role => {
            const onChange = function(e) {
              const up = { [role]: e.target.checked ? true : null };
              db.launchPerm.update(launchId, user.id, up);
            };

            return <Form.Switch inline key={user.id + role} id={user.id + role}
              className='ml-2'
              label={role.toUpperCase()}
              disabled={(user.cert?.level ?? 0) <= 1}
              onChange={onChange}
              checked={perm?.[role] !== undefined} />;
          })
        }
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
  const launchUsers = db.launchUsers.useValue(launchId);
  const perms = db.launchPerms.useValue(launchId);
  const launch = db.launch.useValue(launchId);

  if (!launch) { return <Loading wat='User launch' />; }
  if (!launchUsers) { return <Loading wat='Launch users' />; }
  if (!perms) { return <Loading wat='Perms' />; }

  return <>
    <h2 className='d-flex mt-4'>{children}</h2>

    {editUserId ? <UserEditor launchId={launchId} userId={editUserId} onHide={() => setEditUserId(undefined)} /> : null}

    <div className='deck' {...props}>
      {
        sortArray(Object.values(launchUsers), 'name')
          .map(launchUser => {
            const perm = perms[launchUser.id];
            if (filter && !filter(launchUser, perm)) { return null; }

            const { id, name } = launchUser;

            const badges : ReactNode[] = [];
            if (perm?.lco !== undefined) { badges.push(<Badge key='lco' className='ml-1' pill variant={launchUser.role == 'lco' ? 'primary' : 'light'}>LCO</Badge>); }
            if (perm?.rso !== undefined) { badges.push(<Badge key='rso' className='ml-1' pill variant={launchUser.role == 'rso' ? 'primary' : 'light'}>RSO</Badge>); }

            return <Button key={id}
              variant='outline-dark text-left'
              className={`d-flex flex-grow-1 align-items-center ${launchUser.photoURL ? 'pl-0 py-0' : ''}`}
              onClick={() => setEditUserId(launchUser.id)}>
              {
                launchUser.photoURL && <img src={launchUser.photoURL} style={{ height: '48px' }}/>
              }
              <span className='flex-grow-1 ml-2'>{name}</span>

              {perm?.lco && <RoleBadge role='lco' user={launchUser} />}
              {perm?.rso && <RoleBadge role='rso' user={launchUser} />}
              <CertDot className='ml-2 flex-grow-0' cert={launchUser.cert} />
            </Button>;
          })}
    </div>
  </>;
}
