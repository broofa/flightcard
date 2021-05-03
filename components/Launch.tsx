import React, { useState } from 'react';
import { Button, ButtonGroup, Tab, Tabs } from 'react-bootstrap';
import { Redirect, Route, Switch, useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { db, DELETE } from '../firebase';
import { iLaunchUser, iPerm, iUser } from '../types';
import { useCurrentUser } from './App';
import CardForm from './CardForm';
import { CertDot } from './CertDot';
import Editor from './Editor';
import { UserFilterFunction, UserList } from './UserList';
import { Loading, sortArray } from './util';
import { Waiver } from './Waiver';

function rsoUsers(user ?: iLaunchUser, perm ?: iPerm) {
  return perm?.rso !== undefined;
}

function lcoUsers(user ?: iLaunchUser, perm ?: iPerm) {
  return perm?.lco !== undefined;
}

function lowPowerUsers(user : iLaunchUser) {
  return (user.cert?.level ?? 0) == 0;
}

function highPowerUsers(user : iLaunchUser) {
  return (user.cert?.level ?? 0) > 0;
}

function CertForm({ user, launchId } : {user : iUser, launchId : string}) {
  function onSave() {
    const el = document.querySelector('input[name=certLevel]:checked') as HTMLElement;
    const cert = JSON.parse(el?.dataset.cert ?? 'null');
    if (!cert) return;
    db.launchUser.updateChild(launchId, user.id, 'cert', { ...cert, verifiedDate: DELETE });
  }

  return <Editor onSave={onSave}>
    <p>Select your high power certification, please &hellip;</p>
    {
      [
        { level: 0 },
        { type: 'nar', level: 1 },
        { type: 'tra', level: 1 },
        { type: 'nar', level: 2 },
        { type: 'tra', level: 2 },
        { type: 'nar', level: 3 },
        { type: 'tra', level: 3 }
      ].map((cert, i) => <label key={i} className='mr-5'>
          <input type='radio' data-cert={JSON.stringify(cert)} className='mr-2' name='certLevel'></input>
          <CertDot cert={{ verifiedDate: '-', ...cert }} expand={true} />
        </label>)
    }
  </Editor>;
}

function UsersPane({ launchId }) {
  const [userFilter, setUserFilter] = useState<UserFilterFunction>();

  let title;
  switch (userFilter) {
    case lcoUsers: title = 'Launch Control Officers (LCOs)'; break;
    case rsoUsers: title = 'Range Safety Officers (RSOs)'; break;
    case lowPowerUsers: title = 'Low Power'; break;
    case highPowerUsers: title = 'High Power'; break;
    default: title = 'All Attendees';
  }

  return <>
      <ButtonGroup className='mt-4'>
      <Button active={!userFilter} onClick={() => setUserFilter(undefined)}>All</Button>
      <Button active={userFilter === lcoUsers} onClick={() => setUserFilter(() => lcoUsers)}>LCOs</Button>
      <Button active={userFilter === rsoUsers} onClick={() => setUserFilter(() => rsoUsers)}>RSOs</Button>
      <Button active={userFilter === lowPowerUsers} onClick={() => setUserFilter(() => lowPowerUsers)}><span className='cert-dot'>LP</span></Button>
      <Button active={userFilter === highPowerUsers} onClick={() => setUserFilter(() => highPowerUsers)}><span className='cert-dot'>HP</span></Button>
    </ButtonGroup>

    <UserList launchId={launchId} filter={userFilter}>{title}</UserList>

    {
      // racks?.map(rack => <Rack key={rack.id} cards={lcoCards} launchId={launchId as number} rackId={rack.id} />)
    }
  </>;
}

function RangeSafetyPane({ launchId }) {
  const history = useHistory();
  const match = useRouteMatch();

  const cards = db.launchCards.useValue(launchId);
  const users = db.launchUsers.useValue(launchId);

  if (!cards) return <Loading wat='Flight cards' />;
  if (!users) return <Loading wat='Users' />;

  return <>
    <Button className='mb-4' onClick={() => history.push(`${match.url}/cards/create`)}>Create Flight Card</Button>
    <h2>Awaiting Approval</h2>
    <div className='deck'>
      {
        sortArray(Object.values(cards), c => users[c.userId].name)
          .filter(card => !card.rsoId)
          .map(card => {
            const user = users[card.userId];
            return <Button variant='outline-dark' key={card.id}>
                <h3>{user.name}<CertDot cert={user.cert} /></h3>
                <div>{card.rocket?.name ?? '(no name)'} &mdash; {card.motor?.name ?? '(motor?)'}</div>
            </Button>;
          })
      }
    </div>
  </>;
}
function LaunchControlPane({ launchId }) {
  // racks?.map(rack => <Rack key={rack.id} cards={lcoCards} launchId={launchId as number} rackId={rack.id} />)
  return <>
    <p>Coming soon</p>
  </>;
}

function Launch() {
  const history = useHistory();
  const match = useRouteMatch();
  const [currentUser] = useCurrentUser();
  const params = useParams<{launchId : string, tabKey : string }>();

  const { launchId, tabKey } = params;
  const launchUser = db.launchUser.useValue(launchId, currentUser?.id);

  if (!currentUser) return <Loading wat='User (Launch)' />;
  if (!launchId || !launchUser) return <Waiver user={currentUser} launchId={launchId} />;
  if (!launchUser.cert) return <CertForm user={currentUser} launchId={launchId} />;

  return <>
    <Tabs className='mb-3' defaultActiveKey={tabKey} onSelect={k => history.push(`/launches/${launchId}/${k}`)} >
      <Tab eventKey='rso' title='Range Safety' />
      <Tab eventKey='lco' title='Launch Control' />
      <Tab eventKey='users' title='Attendees' />
    </Tabs>

    <Switch>
      <Route path={`${match.path}/cards/:cardId`}>
        <CardForm />
      </Route>

      <Route path={`${match.path}/rso`}>
        <RangeSafetyPane launchId={launchId}/>
      </Route>

      <Route path={`${match.path}/lco`}>
        <LaunchControlPane launchId={launchId} />
      </Route>

      <Route path={`${match.path}/users`}>
        <UsersPane launchId={launchId} />
      </Route>

      <Route>
          <Redirect to={`${match.url}/users`} />
      </Route>

    </Switch>
  </>;
}

export default Launch;
