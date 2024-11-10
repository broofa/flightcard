import React, {
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
} from 'react';
import { Button } from 'react-bootstrap';
import { Loading, busy } from '/components/common/util';
import { rtRemove } from '/rt';
import { CARD_PATH } from '/rt/rtconstants';
import { CardStatus, type iCard, type iPad } from '../../types';
import { arrayGroup, arraySort } from '../../util/array-util';
import RolePref from '../Profile/RolePref';
import { useIsOfficer } from '../contexts/officer_hooks';
import {
  useAttendees,
  useCards,
  useCurrentAttendee,
  useLaunch,
  usePads,
} from '../contexts/rt_hooks';
import { LaunchCard } from './LaunchCard';

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
          {cards.map((card) => {
            const rtFields = {
              launchId: card.launchId,
              cardId: card.id,
            };
            const unrack: MouseEventHandler = async (e) => {
              const path = CARD_PATH.append('padId').with(rtFields);
              busy(e.currentTarget, rtRemove(path));
            };

            return (
              <div key={card.id} className='d-flex'>
                <LaunchCard className='mt-2' card={card} summary={true} />
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
    content = <LaunchCard className='mt-2' card={cards[0]} summary={true} />;
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
    (card) => card.status === CardStatus.FLY
  );

  const padsBygroup = arrayGroup(Object.values(pads), (pad) => pad.group ?? '');

  const cardsByPad = arrayGroup(readyCards, (card) => card.padId ?? '');

  const unrackedCards = cardsByPad.get('');
  cardsByPad.delete('');

  const groupNames = [...padsBygroup.keys()].sort();

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

      {groupNames.map((groupName) => {
        const pads = padsBygroup.get(groupName);
        if (!pads) return null;

        arraySort(pads, (pad) => pad.name ?? '');

        return (
          <div key={groupName}>
            <h2 className='mt-3'>{groupName}</h2>
            {pads.map((pad) => {
              const cards = cardsByPad.get(pad.id);
              if (!cards) return null;

              return <PadCard key={pad.id} pad={pad} cards={cards} />;
            })}
          </div>
        );
      })}

      {unrackedCards?.length ? (
        <>
          <hr />
          <h2>RSO Approved (waiting for pad)</h2>
          {unrackedCards.map((card) => (
            <LaunchCard key={card.id} card={card} />
          ))}
        </>
      ) : null}
    </>
  );
}
