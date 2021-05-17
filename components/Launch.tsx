import React, { useContext, useState } from 'react';
import { Alert, Button, ButtonGroup, Card, Tab, Tabs } from 'react-bootstrap';
import { Link, NavLink, Redirect, Route, Switch, useHistory, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { iAttendee, iAttendees, iCard, iPerm } from '../types';
import { AppContext } from './App';
import CardEditor from './CardEditor';
import { CardsPane } from './CardsPane';
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
    <ButtonGroup className='mt-2'>
      <Button active={!userFilter} onClick={() => setUserFilter(undefined)}>All</Button>
      <Button active={userFilter === officerUsers} onClick={() => setUserFilter(() => officerUsers)}>{'\u2605'}</Button>
      <Button active={userFilter === lowPowerUsers} onClick={() => setUserFilter(() => lowPowerUsers)}><span className='cert-dot'>LP</span></Button>
      <Button active={userFilter === highPowerUsers} onClick={() => setUserFilter(() => highPowerUsers)}><span className='cert-dot'>HP</span></Button>
    </ButtonGroup>

    <UserList launchId={launchId} filter={userFilter}>{title}</UserList>
  </>;
}

export function CardList({ cards, attendees } : {cards : iCard[], attendees ?: iAttendees}) {
  if (attendees) {
    sortArray(cards, card => attendees[card.userId].name);
  } else {
    sortArray(cards, card => card.rocket?.name);
  }

  return <div className='deck'>
    {
      cards.map(card => <LaunchCard key={card.id} card={card} attendee={attendees?.[card.userId]} />)
    }
  </div>;
}

function RangeSafetyPane({ launchId }) {
  const { cards, attendees } = useContext(AppContext);

  if (!cards) return <Loading wat='Flight cards' />;
  if (!attendees) return <Loading wat='Users' />;

  const rsoCards = Object.values(cards).filter(c => c.status == 'review');

  return <>
    <h2>RSO Requests</h2>
    <CardList cards={rsoCards} attendees={attendees} />
  </>;
}

function PadCard({ padId }) {
  const { cards, attendees } = useContext(AppContext);
  const pad = db.pad.useValue(padId);

  const padCards = cards
    ? Object.values(cards).filter(c => c.padId == padId && c.status == 'ready')
    : [];

  if (!pad) return <Loading wat='Pad' />;

  let title, body;

  if (padCards.length == 1) {
    const card = padCards[0];
    const attendee = attendees?.[card.userId];
    title = <div className='d-flex'>
      {
        attendee
          ? <AttendeeInfo className='flex-grow-1 me-1' hidePhoto attendee={attendee} />
          : <span className='flex-grow-1' />
      }
    </div>;

    body = <div className='mt-1 p-2 text-center'>
      {
        card?.rocket
          ? <>
            <div>{card.rocket?.name ?? ''}</div>
            <div className='fw-bold'>{card?.motor?.name}</div>
          </>
          : null
      }
    </div>;
  } else if (padCards.length > 1) {
    const names = padCards.map(c => attendees?.[c.userId]?.name);
    const last = names.pop();

    title = <Alert className='mx-2 my-auto p-0 flex-grow-1 text-center' variant='danger'>Pad Conflict</Alert>;

    body = <div className='p-2'>
      This pad is claimed by:
      {padCards.map(c => {
        const flier = attendees[c.userId];
        return <Link key={c.id} className='mx-2' to={`/launches/${c.launchId}/cards/${c.id}`}>{flier.name}</Link>;
      })}
    </div>;
  }

  return <Card className='position-relative rounded cursor-pointer' style={{ opacity: body ? 1 : 0.33 }}>
    <div className='d-flex'>
      <span className='flex-grow-0 p-1 me-2 bg-dark text-light text-center'
        style={{ fontSize: '1.3em', minWidth: '2em' }}>{pad?.name}</span>
      {title || <span className='flex-grow-1' />}
    </div>

    {body}

  </Card>;
}

function LaunchControlPane({ launchId }) {
  const { launch } = useContext(AppContext);

  return <>
    {
      launch?.racks?.map((rack, rackIndex) => <div key={rackIndex}>
        <h2 className='mt-5 mb-2'>{rack.name}</h2>
        <div className='deck ms-5'>
        {
          rack.padIds?.map((padId, padIndex) => {
            // const padCards = Object.values(cards).filter(card => card.padId === padId);

            return <PadCard key={padIndex} padId={padId} />;
          })
        }
        </div>
      </div>)
    }
  </>;
}

function Launch() {
  const history = useHistory();
  const { currentUser } = useContext(AppContext);
  const params = useParams<{launchId : string, tabKey : string }>();

  const { launchId, tabKey } = params;
  const attendee = db.attendee.useValue(launchId, currentUser?.id);

  if (!currentUser) return <Loading wat='User (Launch)' />;
  if (!launchId || !attendee) return <Waiver user={currentUser} />;

  function LaunchTabs() {
    return <>
      <Tabs className='mb-3' defaultActiveKey={tabKey} onSelect={k => history.push(`/launches/${launchId}/${k}`)} >
        <Tab eventKey='cards' title='Cards' />
        <Tab eventKey='rso' title='Range Safety' />
        <Tab eventKey='lco' title='Launch Control' />
      </Tabs>
    </>;
  }

  return <>
    {
      !attendee?.cert
        ? <Alert variant='warning'>Please set your certification level in <Link to={`/launches/${launchId}/profile`}>your launch profile</Link></Alert>
        : null
    }

    <Switch>
      <Route exact path={'/launches/:launchId/cards'}>
        <LaunchTabs />
        <CardsPane launchId={launchId} />
      </Route>

      <Route path={'/launches/:launchId/cards/:cardId'}>
        <CardEditor />
      </Route>

      <Route path={'/launches/:launchId/profile'}>
        <CertForm user={attendee} launchId={launchId} />
      </Route>

      <Route path={'/launches/:launchId/rso'}>
        <LaunchTabs />
        <RangeSafetyPane launchId={launchId} />
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
