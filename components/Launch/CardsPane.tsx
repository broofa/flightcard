import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useMakeNewCard } from '../common/useMakeNewCard';
import { Loading } from '../common/util';
import { useLaunch } from '../contexts/LaunchContext';
import { useCards, useCurrentUser } from '../contexts/rthooks';
import { CardList } from './Launch';
import { CardStatus } from '/types';

export function CardsPane() {
  const [launch] = useLaunch();
  const [currentUser] = useCurrentUser();
  const [cards] = useCards();
  const makeNewCard = useMakeNewCard();

  if (!launch) return <Loading wat='Launch' />;
  if (!currentUser) return <Loading wat='User' />;

  const userCards = Object.values(cards || {}).filter(
    c => c.userId == currentUser.id
  );
  const draftCards = userCards.filter(c => !c.status);
  const reviewCards = userCards.filter(c => c.status == CardStatus.REVIEW);
  const readyCards = userCards.filter(c => c.status == CardStatus.READY);
  const doneCards = userCards.filter(c => c.status == CardStatus.DONE);


  return (
    <>
      <div className='d-flex my-2 gap-3'>
        <h2 className='flex-grow-1'>Drafts</h2>
        <Button onClick={makeNewCard} className='my-1'>
          New Flight Card &hellip;
        </Button>
      </div>
      {draftCards.length ? (
        <CardList cards={draftCards} />
      ) : (
        <p className='text-secondary'>Nothing here</p>
      )}

      <h2>Review</h2>
      {reviewCards.length ? (
        <CardList cards={reviewCards} />
      ) : (
        <p className='text-secondary'>Nothing here</p>
      )}

      <h2>Ready to Launch</h2>
      {readyCards.length ? (
        <CardList cards={readyCards} />
      ) : (
        <p className='text-secondary'>Nothing here</p>
      )}

      <h2>Completed</h2>
      {doneCards.length ? (
        <CardList cards={doneCards} />
      ) : (
        <p className='text-secondary'>Nothing here</p>
      )}
    </>
  );
}
