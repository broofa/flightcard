import React, { useContext, useState } from 'react';
import { Alert, Button, ButtonGroup } from 'react-bootstrap';
import { Link, Route, Switch, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { iAttendee, iAttendees, iCard, iPerm } from '../types';
import { sortArray } from '../util/sortArray';
import { ANONYMOUS, AppContext } from './App';
import CardEditor from './CardEditor';
import { CardsPane } from './CardsPane';
import { LaunchCard } from './LaunchCard';
import LaunchEditor from './LaunchEditor';
import LaunchHome from './LaunchHome';
import ProfilePage from './ProfilePage';
import { AttendeeInfo, UserFilterFunction, UserList } from './UserList';
import { Loading } from './common/util';
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

function RangeSafetyPane() {
  const { cards, attendees } = useContext(AppContext);

  if (!attendees) return <Loading wat='Users' />;

  const rsoCards = Object.values(cards || {}).filter(c => c.status == 'review');

  return <>
    <h2>RSO Requests</h2>
    {
      rsoCards?.length
        ? <CardList cards={rsoCards} attendees={attendees} />
        : <Alert variant='secondary'>No RSO requests at this time.</Alert>
    }
  </>;
}

function PadCard({ padId }) {
  const { launch, cards, attendees } = useContext(AppContext);
  const pad = db.pad.useValue(launch?.id, padId);

  const padCards = cards
    ? Object.values(cards).filter(c => c.padId == padId && c.status == 'ready')
    : [];

  if (!pad) return <Loading wat='Pad' />;

  let title, body, link;

  if (padCards.length == 1) {
    const card = padCards[0];
    const attendee = attendees?.[card.userId];
    link = `/launches/${card.launchId}/cards/${card.id}`;
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
    title = <Alert className='mx-2 my-auto p-0 flex-grow-1 text-center' variant='danger'>Pad Conflict</Alert>;

    body = <div className='p-2'>
      Cards assigned to this pad:
      {padCards.map(c => {
        const flier = attendees?.[c.userId];
        return flier && <Link key={c.id} className='mx-2' to={`/launches/${c.launchId}/cards/${c.id}`}>{flier.name ?? ANONYMOUS}</Link>;
      })}
    </div>;
  }

  return <Link to={link} className='launch-card text-center rounded border border-dark d-flex flex-column p-1 cursor-pointer' style={{ opacity: body ? 1 : 0.33 }}>
    <div className='d-flex'>
      <span className='flex-grow-0 p-1 me-2 bg-dark text-light text-center'
        style={{ fontSize: '1.3em', minWidth: '2em' }}>{pad?.name}</span>
      {title || <span className='flex-grow-1' />}
    </div>

    {body}
  </Link>;
}

function LaunchControlPane() {
  const { launch } = useContext(AppContext);

  return <>
    {
      launch?.racks?.map((rack, rackIndex) => <div key={rackIndex}>
        <h2>{rack.name}</h2>
        <div className='deck ms-3'>
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
  const { currentUser } = useContext(AppContext);
  const params = useParams<{launchId : string }>();

  const { launchId } = params;
  const attendee = db.attendee.useValue(launchId, currentUser?.id);

  if (!currentUser) return <Loading wat='User (Launch)' />;
  if (!launchId || !attendee) return <Waiver user={currentUser} />;

  return <>
    <Switch>
      <Route exact path={'/launches/:launchId/cards'}>
        <CardsPane launchId={launchId} />
      </Route>

      <Route path={'/launches/:launchId/cards/:cardId'}>
        <CardEditor />
      </Route>

      <Route path={'/launches/:launchId/edit'}>
        <LaunchEditor />
      </Route>

      <Route path={'/launches/:launchId/profile'}>
        <ProfilePage user={attendee} launchId={launchId} />
      </Route>

      <Route path={'/launches/:launchId/rso'}>
        <RangeSafetyPane />
      </Route>

      <Route path={'/launches/:launchId/lco'}>
        <LaunchControlPane />
      </Route>

      <Route path={'/launches/:launchId/users'}>
        <UsersPane launchId={launchId} />
      </Route>

      <Route path={'/launches/:launchId/'}>
        <LaunchHome />
      </Route>
    </Switch>
  </>;
}

export default Launch;
