import React, { HTMLAttributes } from 'react';
import { Alert } from 'react-bootstrap';
import { Route, Routes } from 'react-router-dom';
import CardEditor from '../Cards/CardEditor';
import CardSummary from '../Cards/CardSummary';
import { useCurrentUser } from '../contexts/rthooks';
import ProfilePage from '../Profile/ProfilePage';
import Stats from '../Stats/Stats';
import { CardsPane } from './CardsPane';
import { LCOPane } from './LCOPane';
import { RSOPane } from './RSOPane';
import { UsersPane } from './UsersPane';
import { cn, Loading } from '/components/common/util';
import { LaunchCard } from '/components/Launch/LaunchCard';
import LaunchEditor from '/components/LaunchEditor/LaunchEditor';
import { iAttendees, iCard } from '/types';
import { arraySort } from '/util/arrayUtils';

export function CardList({
  cards,
  attendees,
}: {
  cards: iCard[];
  attendees?: iAttendees;
}) {
  if (attendees) {
    arraySort(cards, card => attendees[card.userId].name);
  } else {
    arraySort(cards, card => card.rocket?.name);
  }

  return (
    <div className='deck'>
      {cards.map(card => (
        <LaunchCard
          key={card.id}
          card={card}
          attendee={attendees?.[card.userId]}
        />
      ))}
    </div>
  );
}

function PadName({
  children,
  className = '',
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        className,
        `flex-grow-0 px-1 bg-dark text-light text-center`
      )}
      style={{ minWidth: '2em' }}
    >
      {children}
    </span>
  );
}

function Launch() {
  const [currentUser, userLoading] = useCurrentUser();

  if (!currentUser && userLoading) return <Loading wat='User (Launch)' />;

  return (
    <>
      <Routes>
        <Route path='cards' element={<CardsPane />} />
        <Route path='cards/:cardId' element={<CardEditor />} />
        <Route path='cards/:cardId/summary' element={<CardSummary />} />
        <Route path='edit' element={<LaunchEditor />} />
        <Route path='profile' element={<ProfilePage />} />
        <Route path='report' element={<Stats />} />
        <Route path='rso' element={<RSOPane />} />
        <Route path='lco' element={<LCOPane />} />
        <Route path='users' element={<UsersPane />} />
        <Route
          path='*'
          element={<Alert variant='warning'>Page not found</Alert>}
        />
      </Routes>
    </>
  );
}

export default Launch;
