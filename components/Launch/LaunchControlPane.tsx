import React, { HTMLAttributes } from 'react';
import { arrayGroup, arraySort } from '../../util/arrayUtils';
import { useLaunch } from '../contexts/LaunchContext';
import { useIsOfficer, useRoleAPI } from '../contexts/OfficersContext';
import {
  useAttendees,
  useCards,
  useCurrentAttendee,
  usePads,
} from '../contexts/rthooks';
import RolePref from '../Profile/RolePref';
import { Loading } from '/components/common/util';
import { CardStatus, iCard } from '/types';

function MiniCard({
  card,
  ...props
}: {
  card: iCard;
} & HTMLAttributes<HTMLDivElement>) {
  const [attendees] = useAttendees();
  const [pads] = usePads();

  const pad = pads?.[card.padId ?? ''];
  const user = attendees?.[card.userId ?? ''];

  return (
    <div {...props} className='d-flex border border-dark rounded'>
      <div className='flex-grow-0 text-nowrap border-dark px-2 me-2' style={{borderRight: 'solid 1px'}}>
        {pad?.name ?? '-'}
      </div>
      <div className='flex-grow-1'>
        "{card.rocket?.name ?? '(Unnamed Rocket)'}", by {user?.name}
      </div>
    </div>
  );
}

function MiniCardList({
  cards,
  ...props
}: {
  cards: iCard[];
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className='deck ms-3' {...props}>
      {cards.map(card => (
        <MiniCard key={card.id} card={card} />
      ))}
    </div>
  );
}

// YOU WERE HERE, REVAMPING CARD LISTS

export function LaunchControlPane() {
  const [pads] = usePads();
  const [launch] = useLaunch();
  const [currentAttendee] = useCurrentAttendee();
  const [attendees] = useAttendees();
  const [allCards = []] = useCards();
  const isOfficer = useIsOfficer();

  if (!pads) return <Loading wat='Pads' />;
  if (!attendees) return <Loading wat='Attendees' />;
  if (!allCards) return <Loading wat='Cards' />;


  const readyCards = Object.values(allCards).filter(
    card => card.status === CardStatus.FLY
  );

  const cardsByRack = arrayGroup(readyCards, card => {
    return pads[card?.padId ?? '']?.group ?? '';
  });

  const unrackedCards = cardsByRack[''];
  delete cardsByRack[''];

  Object.values(allCards).filter(
    card => card.status == CardStatus.FLY && !card.padId
  );

  const groupNames = Object.keys(cardsByRack)
    .filter(n => n)
    .sort();

  return (
    <>
      {isOfficer ? (
        <div className='d-flex justify-content-center align-items-baseline mb-3'>
          <div className='me-2'>My Status: </div>
          <RolePref
            launchId={launch?.id ?? ''}
            userId={currentAttendee?.id ?? ''}
          />
        </div>
      ) : null}

      <h2>On Pads</h2>

      {groupNames.map(groupName => {
        const cards = cardsByRack[groupName];
        arraySort(cards, card => pads[card.padId ?? ''].name);
        return (
          <div key={groupName}>
            <h3 className='mt-3'>{groupName}</h3>
            <MiniCardList cards={cards} />
          </div>
        );
      })}

      {unrackedCards?.length ? (
        <>
          <hr />
          <h2>Waiting For Pad</h2>
          <MiniCardList cards={unrackedCards} />
        </>
      ) : null}
    </>
  );
}
