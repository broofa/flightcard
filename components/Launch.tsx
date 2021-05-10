import React, { useState } from 'react';
import { Alert, Button, ButtonGroup, Card, Tab, Tabs } from 'react-bootstrap';
import { Link, Redirect, Route, Switch, useHistory, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { iAttendee, iPerm } from '../types';
import { useCurrentUser } from './App';
import CardForm from './CardForm';
import CertForm from './CertForm';
import { LaunchCard } from './LaunchCard';
import { AttendeeInfo, UserFilterFunction, UserList } from './UserList';
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
  const cards = db.cards.useValue(launchId);
  const attendees = db.attendees.useValue(launchId);

  if (!cards) return <Loading wat='Flight cards' />;
  if (!attendees) return <Loading wat='Users' />;

  return <>
    <Button className='mb-4' onClick={() => history.push(`/launches/${launchId}/cards/create`)}>Create Flight Card</Button>
    <h2>Awaiting Approval</h2>
    <div className='deck'>
      {
        sortArray(Object.values(cards), card => attendees[card.userId].name)
          .filter(card => !card.rsoId)
          .map(card => <LaunchCard key={card.id} card={card} attendee={attendees[card.userId]} />)
      }
    </div>
  </>;
}

function PadCard({ padId, launchId }) {
  const pad = db.pad.useValue(padId);
  const card = db.card.useValue(launchId, pad?.cardId);
  const attendee = db.attendee.useValue(launchId, card?.userId);

  if (!pad) return <Loading wat='Pad' />;
  if (pad.cardId && !card) return <Loading wat='Card' />;
  if (card?.userId && !attendee) return <Loading wat='User' />;

  return <Card className='position-relative rounded cursor-pointer' style={{ opacity: card ? 1 : 0.33 }}>
    <div className='d-flex mt-1' style={{ fontSize: '1.3em' }}>
      <span className='flex-grow-0 p-1 mr-2 bg-dark text-light text-center' style={{ minWidth: '2em' }}>{pad?.name}</span>

      {
        attendee
          ? <AttendeeInfo className='flex-grow-1 mr-1' hidePhoto attendee={attendee} />
          : <span className='flex-grow-1' />
      }
    </div>

    <div className='mt-1 p-2 text-center'>
      {
        card?.rocket
          ? <>
          <div>
            {card.rocket?.name ?? ''}
            </div>
          <div className='font-weight-bold'>
            {card?.motor?.name}
            </div>
        </>
          : null
      }
      </div>
  </Card>;
}

function LaunchControlPane({ launchId }) {
  const launch = db.launch.useValue(launchId);

  return <>
    {
      launch?.racks?.map((rack, rackIndex) => <div key={rackIndex}>
        <h2 className='mt-5 mb-2'>{rack.name}</h2>
        <div className='deck ml-5'>
        {
          rack.padIds?.map((padId, padIndex) => <PadCard key={padIndex} padId={padId} launchId={launchId} />)
        }
        </div>
      </div>)
    }
  </>;
}

function Launch() {
  const history = useHistory();
  const [currentUser] = useCurrentUser();
  const params = useParams<{launchId : string, tabKey : string }>();

  const { launchId, tabKey } = params;
  const attendee = db.attendee.useValue(launchId, currentUser?.id);

  if (!currentUser) return <Loading wat='User (Launch)' />;
  if (!launchId || !attendee) return <Waiver user={currentUser} />;

  function LaunchTabs() {
    return <>
      <Tabs className='mb-3' defaultActiveKey={tabKey} onSelect={k => history.push(`/launches/${launchId}/${k}`)} >
        <Tab eventKey='rso' title='Range Safety' />
        <Tab eventKey='lco' title='Launch Control' />
        <Tab eventKey='users' title='Attendees' />
      </Tabs>
    </>;
  }

  return <>
    {
      !attendee?.cert
        ? <Alert variant='warning'>Please set your certification level in <Link to={`/launches/${launchId}/profile`}>your profile page</Link></Alert>
        : null
    }

    <Switch>
      <Route path={'/launches/:launchId/cards/:cardId'}>
        <CardForm edit={true} />
      </Route>

      <Route path={'/launches/:launchId/profile'}>
        <CertForm user={attendee} launchId={launchId} />
      </Route>

      <Route path={'/launches/:launchId/rso'}>
        <LaunchTabs />
        <RangeSafetyPane launchId={launchId}/>
      </Route>

      <Route path={'/launches/:launchId/lco'}>
        <LaunchTabs />
        <LaunchControlPane launchId={launchId} />
      </Route>

      <Route path={'/launches/:launchId/users'}>
        <LaunchTabs />
        <UsersPane launchId={launchId} />
      </Route>

      <Redirect from='/launches/:launchId' to={'/launches/:launchId/users'} />
    </Switch>
  </>;
}

export default Launch;
