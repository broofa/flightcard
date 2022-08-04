import React, { HTMLAttributes, MouseEventHandler, ReactElement } from 'react';
import { Button } from 'react-bootstrap';
import { useIsOfficer } from '../contexts/OfficersContext';
import {
  useAttendees,
  useCards,
  useCurrentAttendee,
  useLaunch,
  usePads,
} from '../contexts/rthooks';
import RolePref from '../Profile/RolePref';
import { LaunchCard } from './LaunchCard';
import { busy, Loading } from '/components/common/util';
import { rtRemove } from '/rt';
import { CARD_PATH } from '/rt/rtconstants';
import { CardStatus, iCard, iPad } from '/types';
import { arrayGroup, arraySort } from '/util/arrayUtils';

function PadCard({
  pad,
  cards,
  ...props
}: {
  pad: iPad;
  cards: iCard[];
} & HTMLAttributes<HTMLDivElement>) {
  let content: ReactElement;

  const isOfficer = useIsOfficer();

  if (cards.length > 1) {
    content = (
      <div className='flex-grow-1'>
        <strong className='text-warning me-2'>{'\u{26A0}'} Pad Conflict</strong>
        <div className='deck'>
          {cards.map(card => {
            const rtFields = {
              launchId: card.launchId,
              cardId: card.id,
            };
            const unrack: MouseEventHandler = async function (e) {
              const path = CARD_PATH.append('padId').with(rtFields);
              busy(e.currentTarget, rtRemove(path));
            };

            return (
              <div key={card.id} className='d-flex'>
                <LaunchCard className='mt-2' card={card} />
                {isOfficer ? (
                  <Button
                    variant='warning'
                    className='flex-grow-0 align-self-center'
                    onClick={unrack}
                  >
                    Unrack
                  </Button>
                ) : null}
              </div>
            );
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

      {groupNames.map(groupName => {
        const pads = padsBygroup[groupName];
        arraySort(pads, pad => pad.name ?? '');
        return (
          <div key={groupName}>
            <h2 className='mt-3'>{groupName}</h2>
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
          <h2>RSO Approved (waiting for pad)</h2>
          {unrackedCards.map(card => (
            <LaunchCard key={card.id} card={card} />
          ))}
        </>
      ) : null}
    </>
  );
}
