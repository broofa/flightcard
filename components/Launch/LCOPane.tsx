import React, { HTMLAttributes, ReactElement } from 'react';
import { arrayGroup, arraySort } from '../../util/arrayUtils';
import { useLaunch } from '../contexts/LaunchContext';
import { useIsOfficer } from '../contexts/OfficersContext';
import {
  useAttendees,
  useCards,
  useCurrentAttendee,
  usePads,
} from '../contexts/rthooks';
import RolePref from '../Profile/RolePref';
import { LaunchCard } from './LaunchCard';
import { Loading } from '/components/common/util';
import { CardStatus, iCard, iPad } from '/types';

function CardTitle({
  card,
  ...props
}: {
  card: iCard;
} & HTMLAttributes<HTMLSpanElement>) {
  const [attendees] = useAttendees();
  const user = attendees?.[card.userId ?? ''];

  return (
    <span {...props}>
      "{card.rocket?.name ?? '(Unnamed Rocket)'}", by{' '}
      {user?.name ?? '(unknown)'}
    </span>
  );
}

function PadCard({
  pad,
  cards,
  ...props
}: {
  pad: iPad;
  cards: iCard[];
} & HTMLAttributes<HTMLDivElement>) {
  let content: ReactElement;

  if (cards.length > 1) {
    console.log(cards);
    content = (
      <div>
        <strong className='text-warning me-2'>{'\u{26A0}'} Pad Conflict</strong>
        <div>
          {cards.map(card => {
            return <LaunchCard key={card.id} className='mt-2' card={card} />;
          })}
        </div>
      </div>
    );
  } else {
    content = <LaunchCard className='mt-2' card={cards[0]} />;
  }

  return (
    <div {...props} className='d-flex'>
      <div className='fw-bold me-3 text-nowrap'>{pad.name}</div>
      {content}
    </div>
  );
}

export function LCOPane() {
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

  const padsBygroup = arrayGroup(Object.values(pads), pad => pad.group ?? '');

  const cardsByPad = arrayGroup(readyCards, card => card.padId ?? '');

  const unrackedCards = cardsByPad[''];
  delete cardsByPad[''];

  const groupNames = Object.keys(padsBygroup).sort();

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
        const pads = padsBygroup[groupName];
        arraySort(pads, pad => pad.name ?? '');
        return (
          <div key={groupName}>
            <h3 className='mt-3'>{groupName}</h3>
            {pads.map(pad => {
              if (!cardsByPad[pad.id]) return null;

              return (
                <PadCard key={pad.id} pad={pad} cards={cardsByPad[pad.id]} />
              );
            })}
          </div>
        );
      })}

      {unrackedCards?.length ? (
        <>
          <hr />
          <h2>Waiting For Pad</h2>
          {unrackedCards.map(card => (
            <LaunchCard key={card.id} card={card} />
          ))}
        </>
      ) : null}
    </>
  );
}
