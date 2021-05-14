import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { AppContext } from './App';
import { CardList } from './Launch';
import { Loading } from './util';

export function CardsPane({ launchId }) {
  const { currentUser, cards } = useContext(AppContext);
  const history = useHistory();

  if (!cards) return <Loading wat='Cards' />;

  const userCards = Object.values(cards).filter(c => c.userId == currentUser?.id);
  const draftCards = userCards.filter(c => !c.status);
  const reviewCards = userCards.filter(c => c.status == 'review');
  const readyCards = userCards.filter(c => c.status == 'ready');
  const doneCards = userCards.filter(c => c.status == 'done');

  return <>
    <div className='d-flex mt-2'>
      <div className='flex-grow-1' />

      <Button onClick={() => history.push(`/launches/${launchId}/cards/create`)}>New Flight Card</Button>
    </div>

    <h2 className='mt-4'>Preflight</h2>
    <CardList cards={draftCards} />

    <h2 className='mt-4'>Pending RSO Signoff</h2>
    <CardList cards={reviewCards} />

    <h2 className='mt-4'>Ready To Launch</h2>
    <CardList cards={readyCards} />

    <h2 className='mt-4'>Done</h2>
    <CardList cards={doneCards} />
  </>;
}
