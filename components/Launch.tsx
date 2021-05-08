import React, { useState } from 'react';
import { Alert, Button, ButtonGroup, Tab, Tabs } from 'react-bootstrap';
import { Link, Redirect, Route, Switch, useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { db } from '../firebase';
import { iAttendee, iPerm } from '../types';
import { useCurrentUser } from './App';
import CardForm from './CardForm';
import { CertDot } from './CertDot';
import { CertForm } from './CertForm';
import { UserFilterFunction, UserList } from './UserList';
import { Loading, sortArray } from './util';
import { Waiver } from './Waiver';

function officerUsers(user ?: iAttendee, isOfficer ?: iPerm) {
  return isOfficer ?? false;
}

function lowPowerUsers(user : iAttendee) {
  return (user.cert?.level ?? 0) == 0;
}

function highPowerUsers(user : iAttendee) {
  return (user.cert?.level ?? 0) > 0;
}

function UsersPane({ launchId }) {
  const [userFilter, setUserFilter] = useState<UserFilterFunction>();

  let title;
  switch (userFilter) {
    case officerUsers: title = '\u2605 Officers (LCOs & RSOs)'; break;
    case lowPowerUsers: title = 'Low Power'; break;
    case highPowerUsers: title = 'High Power'; break;
    default: title = 'All Attendees';
  }

  return <>
      <ButtonGroup className='mt-4'>
      <Button active={!userFilter} onClick={() => setUserFilter(undefined)}>All</Button>
      <Button active={userFilter === officerUsers} onClick={() => setUserFilter(() => officerUsers)}>{'\u2605'}</Button>
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

  const cards = db.cards.useValue(launchId);
  const users = db.attendees.useValue(launchId);

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
  console.log('LANCH', launchId);
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
  const attendee = db.attendee.useValue(launchId, currentUser?.id);

  if (!currentUser) return <Loading wat='User (Launch)' />;
  if (!launchId || !attendee) return <Waiver user={currentUser} />;

  return <>
    {
      !attendee?.cert
        ? <Alert variant='warning'>Please set your certification level in <Link to={`/launches/${launchId}/profile`}>your profile page</Link></Alert>
        : null
    }

    <Tabs className='mb-3' defaultActiveKey={tabKey} onSelect={k => history.push(`/launches/${launchId}/${k}`)} >
      <Tab eventKey='rso' title='Range Safety' />
      <Tab eventKey='lco' title='Launch Control' />
      <Tab eventKey='users' title='Attendees' />
    </Tabs>

    <Switch>
      <Route path={`${match.path}/cards/:cardId`}>
        <CardForm />
      </Route>

      <Route path={`${match.path}/profile`}>
        <CertForm user={currentUser} launchId={launchId} />
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
