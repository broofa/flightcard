import React, { useState, useContext } from 'react';
import { Switch, Route, useParams } from 'react-router-dom';
import { Form, Modal, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import { iUser, iCard, tRole } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
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

function UserEditor({ user, onHide } : {user : iUser, onHide : () => void }) {
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
}

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
            <span className='flex-grow-1 cursor-default'>
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
  const rack = useLiveQuery(() => rackId != null ? db.racks.get(parseInt(rackId)) : undefined, [rackId]);
  const pads = useLiveQuery(() => launchId != null
    ? db.pads
      .where({ launchId })
      .filter(pad => pad.rackId == rackId)
      .toArray()
    : undefined, [launchId]);

  return <>
    <h5 className='mt-5 text-center text-secondary' >{rack?.name || 'Unnamed Rack'}</h5>
    <div className='deck' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(5em, 2fr))' }} {...props}>
      {
        pads?.map(pad => {
          const padCards = cards?.filter(c => c.padId === pad.id) ?? [];
          const card = padCards.length == 1 ? padCards[0] : undefined;

          let body;
          if (padCards?.length > 1) {
            body = <span className='text-danger text-center'>  Multiple fliers {'\u26a0'}</span>;
          } else if (padCards.length == 1) {
            body = <span className='cursor-default'>
              {card?._user?.name}
              {/* {card?.rocket?.manufacturer} - {card?.rocket?.name} */}
            </span>;
          }

          // if (!card) return null;

          return <div key={pad.id} style={{ opacity: padCards.length ? 1 : 0.5 }} className='border border-dark rounded p-2'>
              <span style={{ float: 'left' }} className='bg-dark text-white rounded px-2 mr-2'>
                Pad {pad.name}
              </span>
            {body}
          </div>;
        })
      }
    </div>
  </>;
};

function Launch({ match, history }) {
  const { currentUserId } = useContext(appContext);

  const launchId = useParams<{launchId : string }>().launchId;
  const launch = db.launches.useValue(launchId);

  const launchUsers = db.launchUsers.useValue(launchId);
  const pads = db.pads.useValue<Record<string, iPad>>(launchId);

  const launchUser = launchUsers?.[currentUserId];

  const users = launchUsers ? Object.values(launchUsers) : [];

  if (!launch) return <Loading wat='Launch data' />;

  users.sort(nameComparator);

  if (!launchUser) return <Waiver userId={currentUserId} launchId={launchId} />;

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
          // racks?.map(rack => <Rack key={rack.id} cards={lcoCards} launchId={launchId as number} rackId={rack.id} />)
        }
      </Route>
    </Switch>
  </>;
}

export default Launch;
