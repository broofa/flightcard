import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { AppContext } from './App';
import { CardList } from './Launch';

export function CardsPane({ launchId }) {
  const { currentUser, cards } = useContext(AppContext);
  const history = useHistory();

  const userCards = Object.values(cards || {}).filter(c => c.userId == currentUser?.id);
  const draftCards = userCards.filter(c => !c.status);
  const reviewCards = userCards.filter(c => c.status == 'review');
  const readyCards = userCards.filter(c => c.status == 'ready');
  const doneCards = userCards.filter(c => c.status == 'done');

  return <>

    <div className='d-flex my-2 gap-3'>
      <h2 className='flex-grow-1'>Drafts</h2>
      <Button onClick={() => history.push(`/launches/${launchId}/cards/create`)}>New Flight Card &hellip;</Button>
    </div>
    {
      draftCards.length
        ? <CardList cards={draftCards} />
        : <p className='text-secondary'>Nothing here</p>
    }

    <h2 className='mt-2'>Review</h2>
    {
      reviewCards.length
        ? <CardList cards={reviewCards} />
        : <p className='text-secondary'>Nothing here</p>
}

    <h2 className='mt-4'>Launch</h2>
    {
      readyCards.length
        ? <CardList cards={readyCards} />
        : <p className='text-secondary'>Nothing here</p>
      }

    <h2 className='mt-4'>Completed</h2>
    {
      doneCards.length
        ? <CardList cards={doneCards} />
        : <p className='text-secondary'>Nothing here</p>
      }
  </>;
}
