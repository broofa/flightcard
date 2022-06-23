import React, { HTMLAttributes } from 'react';
import { Alert } from 'react-bootstrap';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { arraySort } from '../../util/arrayUtils';
import { ANONYMOUS } from '../App/App';
import CardEditor from '../CardEditor/CardEditor';
import { useLaunch } from '../contexts/LaunchContext';
import { useAttendees, useCards, useCurrentUser } from '../contexts/rthooks';
import ProfilePage from '../Profile/ProfilePage';
import { CardsPane } from './CardsPane';
import { LaunchControlPane } from './LaunchControlPane';
import { RangeSafetyPane } from './RangeSafetyPane';
import { UsersPane } from './UsersPane';
import { CertDot } from '/components/common/CertDot';
import { Loading } from '/components/common/util';
import { LaunchCard } from '/components/Launch/LaunchCard';
import LaunchEditor from '/components/LaunchEditor/LaunchEditor';
import { db } from '/rt';
import { CardStatus, iAttendees, iCard } from '/types';

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
      className={`flex-grow-0 px-1 bg-dark text-light text-center ${className}`}
      style={{ minWidth: '2em' }}
    >
      {children}
    </span>
  );
}

export function PadCard({ padId }: { padId: string }) {
  const [cards] = useCards();
  const [launch] = useLaunch();
  const [attendees] = useAttendees();
  const navigate = useNavigate();
  const pad = db.pad.useValue(launch?.id, padId);

  const padCards = cards
    ? Object.values(cards).filter(
        c => c.padId == padId && c.status == CardStatus.READY
      )
    : [];

  if (!pad) return <Loading wat='Pad' />;

  const padCardClasses = 'card text-center flex-column';

  if (padCards.length <= 0) {
    // No cards assigned
    return (
      <div className={`${padCardClasses} border-dark`} style={{ opacity: 0.4 }}>
        <div className='d-flex' style={{ fontSize: '1.3em' }}>
          <PadName>{pad.name}</PadName>
          <span className='flex-grow-1' />
        </div>
      </div>
    );
  } else if (padCards.length > 1) {
    // Pad conflict (too many cards)
    return (
      <div className={`${padCardClasses} border-danger`}>
        <div className='d-flex' style={{ fontSize: '1.3rem' }}>
          <PadName className='bg-danger'>{pad.name}</PadName>
          <span className='bg-danger text-white text-center flex-grow-1 fst-italic'>
            Pad Conflict
          </span>
        </div>

        <div className='p-2'>
          Cards assigned to this pad:
          {padCards.map(c => {
            const flier = attendees?.[c.userId];
            return (
              flier && (
                <Link
                  key={c.id}
                  className='mx-2'
                  to={`/launches/${c.launchId}/cards/${c.id}`}
                >
                  {flier.name ?? ANONYMOUS}
                </Link>
              )
            );
          })}
        </div>
      </div>
    );
  }

  const card = padCards[0];
  const attendee = attendees?.[card.userId];

  return (
    <div
      onClick={() => navigate(`/launches/${card.launchId}/cards/${card.id}`)}
      className={`${padCardClasses} border-dark cursor-pointer`}
    >
      <div className='d-flex' style={{ fontSize: '1.3rem' }}>
        <PadName>{pad.name}</PadName>
        {attendee ? (
          <div className={'d-flex align-items-center flex-grow-1'}>
            <span className='flex-grow-1 ms-2 my-0 h3'>
              {attendee?.name ?? ANONYMOUS}
            </span>
            <CertDot
              className='mx-1 flex-grow-0'
              style={{ fontSize: '1rem' }}
              cert={attendee.cert}
            />
          </div>
        ) : (
          <span className='flex-grow-1' />
        )}
      </div>

      <div className='p-2'>
        {card?.rocket ? (
          <>
            <div>{card.rocket?.name ?? ''}</div>
            <div className='fw-bold'>
              {(card?.motors?.length ?? 0) > 1
                ? '(complex)'
                : card?.motors?.[0]?.name}
            </div>
          </>
        ) : null}
      </div>
    </div>
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
        <Route path='edit' element={<LaunchEditor />} />
        <Route path='profile' element={<ProfilePage />} />
        <Route path='rso' element={<RangeSafetyPane />} />
        <Route path='lco' element={<LaunchControlPane />} />
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
