import React, { useState, useContext } from 'react';
import { Switch, Route, useParams, Link } from 'react-router-dom';
import { Form, Modal, Button, Tabs, Tab, Badge, ButtonGroup } from 'react-bootstrap';
import { iUser, tRole, iLaunchUser, iPerm } from '../types';
import Cards from './Cards';
import { Waiver } from './Waiver';
import { appContext } from './App';
import { Loading } from './util';
import { db } from '../firebase';

export function nameComparator(a, b) : number {
  a = a?.name;
  b = b?.name;
  return a < b ? -1 : b < a ? 1 : 0;
}

const CertBadge : React.FC<{user : iUser}> = ({ user, ...props }) => {
  if (!user?.certType) return null;

  const { certType, certLevel } = user;
  let backgroundColor = 'goldenrod';
  if (certLevel == 2) backgroundColor = 'chocolate';
  if (certLevel == 3) backgroundColor = 'brown';

  return <Badge pill className='mx-2 text-uppercase' style={{ backgroundColor }}
    variant='secondary' {...props}>
    {certType.toUpperCase()} {certLevel}
  </Badge>;
};

function UserEditor({ user, onHide } : {user : iUser, onHide : () => void }) {
  if (!user) throw Error('Invalid user');

  const { name, id, launchUser } = user;
  if (!launchUser) throw Error('Invalid launch user');

  const { permissions, verified } = launchUser;

  const onVerify = function(e) {
    launchUser.verified = e.target.checked;
    // db.launchUsers.put(launchUser);
  };

  return <Modal size='lg' show={true} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>{name || '(anonymous)'} <CertBadge user={user}/> </Modal.Title>
    </Modal.Header>

    <Modal.Body>

    {verified ? null : <span className='text-danger font-weight-bold mr-1'>{'\u26a0'}</span>}
    <Form.Switch inline id={'verified'}
      className='ml-2'
      label='Certification card verified by LCO, RSO, or event host'
      onChange={onVerify}
      checked={verified} />
    <h5 className='mt-3'>Qualified For:</h5>
    {
      (['lco', 'rso'] as tRole[]).map(perm => {
        const onChange = function(e) {
          launchUser.permissions = launchUser.permissions.filter(p => p != perm);
          if (e.target.checked) launchUser.permissions.push(perm);
          // db.launchUsers.put(launchUser);
        };

        return <Form.Switch inline key={id + perm} id={id + perm}
          className='ml-2'
          label={perm.toUpperCase()}
          onChange={onChange}
          checked={permissions?.includes(perm)} />;
      })
    }
    </Modal.Body>
  </Modal>;
}

function UserGroup({ launchId, filter, children, ...props } :
  {launchId : string, filter ?: (user : iLaunchUser, perm : iPerm) => boolean, children : any}) {
  const [editingUser, setEditingUser] = useState<iUser | null>(null);
  const launchUsers = db.launchUsers.useValue(launchId);
  const perms = db.launchPerms.useValue(launchId);
  const launch = db.launch.useValue(launchId);

  if (!launch || !launchUsers || !perms) return <Loading wat='User data' />;

  return <>
    <h3 className='d-flex mt-4'>{children}</h3>

    {editingUser ? <UserEditor user={editingUser} onHide={() => setEditingUser(null)} /> : null}

    <div className='deck' {...props}>
      {
      Object.values(launchUsers).map(lu => {
        const perm = perms[lu.id];
        if (filter && !filter(lu, perm)) return null;

        const { id, name } = lu;

        const badges = [];
        if (perm?.lco !== undefined) badges.push(<Badge key='lco' pill variant={perm.lco ? 'success' : 'light'}>LCO</Badge>);
        if (perm?.rso !== undefined) badges.push(<Badge key='rso' pill variant={perm.rso ? 'info' : 'light'}>RSO</Badge>);

        const cn = 'd-flex border-bottom rounded border-dark text-nowrap py-1 px-3';

        return <div key={id} className={cn} onClick={() => setEditingUser(lu)}>
            <span className='flex-grow-1 cursor-default mr-2' style={{ lineHeight: 1 }}>
              {lu.verified ? null : <span className='text-danger font-weight-bold mr-1'>{'\u26a0'}</span>}
              {name || '(anonymous)'}
            </span>
            {badges}
            <CertBadge user={lu} />
          </div>;
      })
    }
    </div>
  </>;
}

function rsoUsers(user : iUser, perm : iPerm) {
  return perm?.rso !== undefined;
}

function lcoUsers(user : iUser, perm : iPerm) {
  return perm?.lco !== undefined;
}

function Launch({ match, history }) {
  const { currentUserId } = useContext(appContext);
  const [userFilter, setUserFilter] = useState<(user : iUser, perm : iPerm) => boolean>();

  const launchId = useParams<{launchId : string }>().launchId;
  const launchUser = db.launchUser.useValue(launchId, currentUserId);

  if (!currentUserId || !launchId || !launchUser) return <Waiver userId={currentUserId as string} launchId={launchId} />;

  let title;
  switch (userFilter) {
    case lcoUsers: title = 'Launch Control Officers (LCOs)'; break;
    case rsoUsers: title = 'Range Safety Officers (RSOs)'; break;
    default: title = 'All Attendees';
  }

  return <>
    <Tabs defaultActiveKey='lco' onSelect={k => history.push(`/launches/${launchId}/${k}`)} >
      <Tab eventKey='lco' title='Launch Control' />
      <Tab eventKey='rso' title='Range Safety' />
      <Tab eventKey='users' title='Attendees' />
    </Tabs>

    <Switch>
      <Route path={`${match.path}/cards/:cardId`}>
        <Cards />
      </Route>

      <Route path={`${match.path}/users`}>
        <ButtonGroup className='mt-4'>
          <Button active={!userFilter} onClick={() => setUserFilter(undefined)}>All</Button>
          <Button active={userFilter === lcoUsers} onClick={() => setUserFilter(() => lcoUsers)}>LCOs</Button>
          <Button active={userFilter === rsoUsers} onClick={() => setUserFilter(() => rsoUsers)}>RSOs</Button>
        </ButtonGroup>
        <UserGroup launchId={launchId} filter={userFilter}>{title}</UserGroup>
        {
          launchUser.role == 'flier'
            ? <Button className='mt-3' href={`${match.url}/cards/create`}>New Flight Card</Button>
            : null
        }
        {
          // racks?.map(rack => <Rack key={rack.id} cards={lcoCards} launchId={launchId as number} rackId={rack.id} />)
        }
      </Route>

      <Route path={`${match.path}/lco`}>
      </Route>

      <Route path={`${match.path}/rso`}>
      </Route>

    </Switch>
  </>;
}

export default Launch;
