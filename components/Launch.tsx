import React, { useState } from 'react';
import { Switch, Route, useParams } from 'react-router-dom';
import { Form, Modal, Button, Tabs, Tab, Badge, Card } from 'react-bootstrap';
import db, { iUser, iCard, tRole } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import Cards from './Cards';
import { Waiver } from './Waiver';
import { useCurrentUser, useLaunchUser, useLaunchUsers } from './hooks';
import Dexie from 'dexie';

const { minKey, maxKey } = Dexie;

export function nameComparator(a, b) : number {
  a = a?.name;
  b = b?.name;
  return a < b ? -1 : b < a ? 1 : 0;
}

const ROLE_NAMES = {
  flier: 'Flier',
  rso: 'RSO',
  lco: 'LCO'
};

const CertBadge : React.FC<{user : iUser}> = ({ user, ...props }) => {
  if (!user?.certType) return null;

  const { certType, certLevel } = user;
  let backgroundColor = 'goldenrod';
  if (certLevel == 2) backgroundColor = 'chocolate';
  if (certLevel == 3) backgroundColor = 'brown';

  return <Badge className='mx-2 text-uppercase' style={{ backgroundColor }}
    variant='secondary' {...props}>
    {certType.toUpperCase()} {certLevel}
  </Badge>;
};

const UserEditor : React.FC<{user : iUser, onHide : () => void }> = ({ user, onHide }) => {
  if (!user) throw Error('Invalid user');

  const { name, id, launchUser } = user;
  if (!launchUser) throw Error('Invalid launch user');

  const { permissions, verified } = launchUser;

  const onVerify = function(e) {
    launchUser.verified = e.target.checked;
    db.launchUsers.put(launchUser);
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
          db.launchUsers.put(launchUser);
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
};

const UserGroup : React.FC<{role ?: tRole, users : iUser[]}> = ({ role, users, children, ...props }) => {
  const [editingUser, setEditingUser] = useState<iUser | null>(null);

  return <>

    <h3 className="d-flex mt-4">{children}</h3>

    {editingUser ? <UserEditor user={editingUser} onHide={() => setEditingUser(null)} /> : null}

    <div className='deck' {...props}>
      {
      users.map(user => {
        const { id, name, launchUser } = user;
        if (!launchUser) return null;

        const { permissions, role: _role } = launchUser;
        if (role && !permissions.includes(role)) return null;
        const displayRole = ROLE_NAMES[launchUser.role ?? ''];

        const cn = 'd-flex border-bottom rounded border-dark text-nowrap py-1 px-3';

        return <div key={id} className={cn} onClick={() => setEditingUser(user)}>
            <span className='flex-grow-1'>
              {launchUser.verified ? null : <span className='text-danger font-weight-bold mr-1'>{'\u26a0'}</span>}
              {name || '(anonymous)'}
            </span>
            {displayRole ? <span className='mx-2'>{}</span> : null}
            {role && _role === role ? <Badge className='mx-2' variant='success'>On Duty</Badge> : null}
            <CertBadge user={user} />
          </div>;
      })
    }
    </div>
  </>;
};

const Rack : React.FC<{launchId, rackId, cards : iCard[] | undefined}> = ({ launchId, rackId, cards, ...props }) => {
  const rack = useLiveQuery(() => rackId != null ? db.racks.get(parseInt(rackId)) : null, [rackId]);
  const pads = useLiveQuery(() => launchId != null ? db.pads.where({ launchId }).toArray() : null, [launchId])
    ?.filter(pad => pad.rackId == rackId);

  return <>
    <h5 className='mt-5 text-center text-secondary' >{rack?.name || 'Unnamed Rack'}</h5>
    <div className='deck' {...props}>
      {
        pads?.map(pad => {
          const card = cards?.find(c => c.padId === pad.id);

          if (!card) return null;

          return <Card key={pad.id} className='p-2 text-nowrap'>
            <Card.Title className={card ? undefined : 'text-secondary'}>Pad {pad.name}: {card?.user?.name}</Card.Title>
            {
              card
                ? <>
                 <Card.Text>
                  {card?.rocket?.manufacturer} - {card?.rocket?.name}
                 </Card.Text>
                <Button size='sm'>Announce</Button>
              </>
                : null
            }
          </Card>;
        })
      }
    </div>
  </>;
};

const Launch : React.FC<{match, history}> = ({ match, history }) => {
  const user = useCurrentUser();

  const launchId = parseInt(useParams<{launchId : string }>().launchId);
  const launch = useLiveQuery(() => db.launches.get(launchId), [launchId]);
  const lcoCards = useLiveQuery(
    () => db.cards.where('[launchId+userId]')
      .between([launchId, minKey], [launchId, maxKey])
      .toArray(),
    [launchId]);

  const launchUser = useLaunchUser(launchId, user?.id);

  const launchUsers = useLaunchUsers(launchId);
  const users = Object.values(launchUsers);

  lcoCards?.forEach((c : any) => c.user = launchUsers[c.userId]);

  const racks = useLiveQuery(
    () => db.racks.where({ launchId }).toArray(),
    [launchId]
  );

  if (!launch || !user) return <p>Loading...</p>;

  users.sort(nameComparator);

  if (!launchUser) return <Waiver userId={user.id} launchId={launch.id} />;

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

      <Route path={`${match.path}/rso`}>
        <UserGroup users={users} role='rso'>Range Safety</UserGroup>
      </Route>

      <Route path={`${match.path}/users`}>
        <UserGroup users={users} >Attendees</UserGroup>
      </Route>

      <Route path={`${match.path}/lco`}>
        <UserGroup users={users} role='lco'>Launch Control Officers</UserGroup>
        {
          launchUser.role == 'flier'
            ? <Button className='mt-3' href={`${match.url}/cards/create`}>New Flight Card</Button>
            : null
        }
        {
          racks?.map(rack => <Rack key={rack.id} cards={lcoCards} launchId={launchId as number} rackId={rack.id} />)
        }
      </Route>
    </Switch>
  </>;
};

export default Launch;
