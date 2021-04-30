import React, { useState, ReactNode, useContext } from 'react';
import { Switch, Route, useParams, Redirect } from 'react-router-dom';
import { Form, Modal, Button, Tabs, Tab, Badge, ButtonGroup } from 'react-bootstrap';
import { iUser, tRole, iLaunchUser, iPerm } from '../types';
import Cards from './Cards';
import { Waiver } from './Waiver';
import { Loading } from './util';
import { db } from '../firebase';
import { appContext } from './App';

export function nameComparator(a, b) : number {
  a = a?.name;
  b = b?.name;
  return a < b ? -1 : b < a ? 1 : 0;
}

const CertBadge : React.FC<{user : iUser, className : string}> = ({ user, className, ...props }) => {
  if (!user?.certType) return null;

  const { certType, certLevel } = user;
  let backgroundColor = 'goldenrod';
  if (certLevel == 2) backgroundColor = 'chocolate';
  if (certLevel == 3) backgroundColor = 'brown';

  return <Badge pill className={`${className ?? ''} text-uppercase`} style={{ backgroundColor }}
    variant='secondary' {...props}>
    {certType.toUpperCase()} {certLevel}
  </Badge>;
};

function UserEditor({ launchId, user, onHide } : {launchId : string, user : iLaunchUser, onHide : () => void }) {
  const perm = db.launchPerm.useValue(launchId, user.id);

  if (!user) throw Error('User not defined');
  if (!perm === undefined) return <Loading wat='User permissions' />;

  const onVerify = function(e) {
    user.verified = e.target.checked;
    db.launchUser.update(launchId, user.id, { verified: !!e.target.checked });
  };

  return <Modal size='lg' show={true} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>{user.name || '(anonymous)'} <CertBadge className='' user={user}/> </Modal.Title>
    </Modal.Header>

    <Modal.Body>

    {user.verified ? null : <span className='text-danger font-weight-bold mr-1'>{'\u26a0'}</span>}
    <Form.Switch inline id={'verified'}
      className='ml-2'
      label='Certification card verified by LCO, RSO, or event host'
      onChange={onVerify}
      checked={user.verified} />
    <h5 className='mt-3'>Qualified For:</h5>
    {
      (['lco', 'rso'] as tRole[]).map(role => {
        const onChange = function(e) {
          const up = { [role]: e.target.checked ? true : null };
          db.launchPerm.update(launchId, user.id, up);
        };

        return <Form.Switch inline key={user.id + role} id={user.id + role}
          className='ml-2'
          label={role.toUpperCase()}
          onChange={onChange}
          checked={perm?.[role] !== undefined} />;
      })
    }
    </Modal.Body>
  </Modal>;
}

function UserGroup({ launchId, filter, children, ...props } :
  {launchId : string, filter ?: (user : iLaunchUser, perm : iPerm) => boolean, children : any}) {
  const [editUser, setEditUser] = useState<iLaunchUser>();
  const launchUsers = db.launchUsers.useValue(launchId);
  const perms = db.launchPerms.useValue(launchId);
  const launch = db.launch.useValue(launchId);

  if (!launch || !launchUsers || !perms) return <Loading wat='User data' />;

  return <>
    <h3 className='d-flex mt-4'>{children}</h3>

    {editUser ? <UserEditor launchId={launchId} user={editUser} onHide={() => setEditUser(undefined)} /> : null}

    <div className='deck' {...props}>
      {
      Object.values(launchUsers).sort(nameComparator).map(lu => {
        const perm = perms[lu.id];
        if (filter && !filter(lu, perm)) return null;

        const { id, name } = lu;

        const badges : ReactNode[] = [];
        if (perm?.lco !== undefined) badges.push(<Badge key='lco' className='ml-1' pill variant={lu.role == 'lco' ? 'primary' : 'light'}>LCO</Badge>);
        if (perm?.rso !== undefined) badges.push(<Badge key='rso' className='ml-1' pill variant={lu.role == 'rso' ? 'primary' : 'light'}>RSO</Badge>);

        const cn = 'd-flex border-bottom rounded border-dark text-nowrap py-1 px-3';

        return <div key={id} className={cn} onClick={() => setEditUser(lu)}>
            <span className='flex-grow-1 cursor-default mr-2' style={{ lineHeight: 1 }}>
              {lu.verified ? null : <span className='text-danger font-weight-bold mr-1'>{'\u26a0'}</span>}
              {name || '(anonymous)'}
            </span>
            {badges}
            <CertBadge className='ml-1' user={lu} />
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
  const [userFilter, setUserFilter] = useState<(user : iUser, perm : iPerm) => boolean>();

  const { currentUser } = useContext(appContext);
  const launchId = useParams<{launchId : string }>().launchId;
  const launchUser = db.launchUser.useValue(launchId, currentUser?.id);

  if (!currentUser) return <Loading wat='User (Launch)' />;
  if (!launchId || !launchUser) return <Waiver user={currentUser} launchId={launchId} />;

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
        <Button className='mt-3' onClick={() => history.push(`${match.url}/cards/create`)}>New Flight Card</Button>
        {
          // racks?.map(rack => <Rack key={rack.id} cards={lcoCards} launchId={launchId as number} rackId={rack.id} />)
        }
      </Route>

      <Route path={`${match.path}/lco`} />
      <Route path={`${match.path}/rso`} />
      <Route>
          <Redirect to={`${match.url}/users`} />
      </Route>

    </Switch>
  </>;
}

export default Launch;
