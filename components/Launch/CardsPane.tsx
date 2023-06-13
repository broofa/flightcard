import React from 'react';
import { Button } from 'react-bootstrap';
import { arrayGroup } from '../../util/array-util';
import { useMakeNewCard } from '../common/useMakeNewCard';
import { Loading } from '../common/util';
import { useCards, useCurrentUser, useLaunch } from '../contexts/rt_hooks';
import { CardList } from './Launch';
import { CardStatus } from '/types';

export function CardsPane() {
  const [launch] = useLaunch();
  const [currentUser] = useCurrentUser();
  const [cards] = useCards();

  const { DRAFT, REVIEW, FLY, DONE } = CardStatus;

  const makeNewCard = useMakeNewCard();

  if (!launch) return <Loading wat='Launch' />;
  if (!currentUser) return <Loading wat='User' />;

  const userCards = Object.values(cards || {}).filter(
    c => c.userId == currentUser.id
  );
  const cardGroups = arrayGroup(userCards, c => c.status ?? DRAFT);
  const draftCards = userCards.filter(c => c.status == DRAFT);
  const reviewCards = userCards.filter(c => c.status == REVIEW);
  const readyCards = userCards.filter(c => c.status == FLY);
  const doneCards = userCards.filter(c => c.status == DONE);

  return (
    <>
      <div className='d-flex my-2 gap-3'>
        <h2 className='flex-grow-1'>Drafts</h2>
        <Button onClick={makeNewCard} className='my-1'>
          New Flight Card &hellip;
        </Button>
      </div>

      {draftCards.length ? (
        <CardList cards={cardGroups.get(DRAFT)} />
      ) : (
        <p className='text-secondary'>Nothing here</p>
      )}

      <h2>Review</h2>
      {reviewCards.length ? (
        <CardList cards={cardGroups.get(REVIEW)} />
      ) : (
        <p className='text-secondary'>Nothing here</p>
      )}

      <h2>Ready to Launch</h2>
      {readyCards.length ? (
        <CardList cards={cardGroups.get(FLY)} />
      ) : (
        <p className='text-secondary'>Nothing here</p>
      )}

      <h2>Completed</h2>
      {doneCards.length ? (
        <CardList cards={cardGroups.get(DONE)} />
      ) : (
        <p className='text-secondary'>Nothing here</p>
      )}
    </>
  );
}
