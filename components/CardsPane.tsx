import React, { useContext } from 'react';
import { AppContext } from './App/App';
import { FCLinkButton } from './common/FCLinkButton';
import { CardList } from '/components/Launch';
import { CardStatus } from '/types';

export function CardsPane({ launchId }: { launchId: string }) {
  const { currentUser, cards } = useContext(AppContext);

  const userCards = Object.values(cards || {}).filter(
    c => c.userId == currentUser?.id
  );
  const draftCards = userCards.filter(c => !c.status);
  const reviewCards = userCards.filter(c => c.status == CardStatus.REVIEW);
  const readyCards = userCards.filter(c => c.status == CardStatus.READY);
  const doneCards = userCards.filter(c => c.status == CardStatus.DONE);

  return (
    <>
      <div className='d-flex my-2 gap-3'>
        <h2 className='flex-grow-1'>Drafts</h2>
        <FCLinkButton className='my-1' to={`/launches/${launchId}/cards/new`}>
          New Flight Card &hellip;
        </FCLinkButton>
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
