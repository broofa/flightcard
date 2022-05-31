import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './App';
import { CardList } from './Launch';

export function CardsPane({ launchId }: { launchId: string }) {
  const { currentUser, cards } = useContext(AppContext);
  const navigate = useNavigate();

  const userCards = Object.values(cards || {}).filter(
    c => c.userId == currentUser?.id
  );
  const draftCards = userCards.filter(c => !c.status);
  const reviewCards = userCards.filter(c => c.status == 'review');
  const readyCards = userCards.filter(c => c.status == 'ready');
  const doneCards = userCards.filter(c => c.status == 'done');

  return (
    <>
      <div className='d-flex my-2 gap-3'>
        <h2 className='flex-grow-1'>Drafts</h2>
        <Button onClick={() => navigate(`/launches/${launchId}/cards/new`)}>
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

      <h2>Launch</h2>
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
