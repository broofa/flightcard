import React, { ChangeEvent } from 'react';
import {
  Button,
  ButtonProps,
  FormSelect,
  FormSelectProps,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { arrayGroup, arraySort } from '../../util/array-util';
import { flash } from '../Flash/flash';
import { Loading, busy } from '../common/util';
import { useCurrentAttendee, usePads } from '../contexts/rt_hooks';
import { DELETE, rtRemove, rtUpdate } from '/rt';
import { CARD_PATH } from '/rt/rtconstants';
import { CardStatus, iAttendee, iCard } from '/types';

const { DRAFT, REVIEW, FLY, DONE } = CardStatus;

export function cardStatusCode(status: CardStatus | undefined) {
  return (
    {
      draft: 0,
      review: 1,
      fly: 2,
      done: 3,
    }[String(status)] ?? 0
  );
}

async function updateCard(card: iCard, update: Partial<iCard>) {
  const rtPath = CARD_PATH.with({ launchId: card.launchId, cardId: card.id });
  return rtUpdate(rtPath, update);
}

export function getCardPermissions(
  card: iCard,
  user: iAttendee,
  isOfficer: boolean
) {
  const status = card.status ?? DRAFT;

  const notes = [];
  const warnings = [];
  switch (status) {
    case DRAFT:
      if (card.padId) {
        warnings.push(
          "Draft cards should not have a pad assigned.  Clear your pad assignment if you're not actively launching."
        );
      }
      if (!card.rsoId) {
        // notes.push('When ready for safety review, click "Submit to RSO"');
      } else if (!card.padId) {
        notes.push(
          'Talk to Launch Control about how pads are assigned.  Once you have a pad assignment and are ready to launch, click "Submit to LCO".'
        );
      }
      break;

    case REVIEW:
    case FLY:
      if (!card.rsoId) {
        warnings.unshift('Present rocket to the Range Safety Officer.');
        if (isOfficer && user.id === card.userId) {
          notes.push('Note: Officers may not RSO their own rockets');
        }
      } else {
        if (!card.padId) {
          notes.push(
            "After you have your rocket racked, specify which pad it's on"
          );
        } else {
          notes.push("Looks like you're ready to go!");
        }
      }
      notes.push(
        'Note: Cards waiting for safety review or launch may not be edited. Click "Withdraw" to make changes.'
      );
      break;

    case DONE:
      notes.push('This card has been flown and is no longer editable.');
      break;
  }

  // // Uncomment to show all buttons
  // if (window as unknown) {
  //   return {
  //     notes,
  //     warnings,

  //     canWithdraw: true,
  //     userCanWithdraw: true,

  //     canSubmitToRSO: true,
  //     userCanSubmitToRSO: true,

  //     canApprove: true,
  //     userCanApprove: true,

  //     canReject: true,
  //     userCanReject: true,

  //     canAssignPad: true,
  //     userCanAssignPad: true,

  //     canSubmitToLCO: true,
  //     userCanSubmitToLCO: true,

  //     canMarkDone: true,
  //     userCanMarkDone: true,

  //     canDelete: true,
  //     userCanDelete: true,
  //   };
  // }

  return {
    notes,
    warnings,

    canWithdraw: status !== DRAFT && status !== DONE,
    userCanWithdraw: isOfficer || user.id === card.userId,

    canSubmitToRSO: !card.rsoId && status !== REVIEW && status !== DONE,
    userCanSubmitToRSO: isOfficer || user.id === card.userId,

    canApprove: !card.rsoId && status === REVIEW,
    userCanApprove: isOfficer && user.id != card.userId,

    canReject: !!card.rsoId && status != DONE,
    userCanReject: isOfficer,

    canAssignPad: (!!card.rsoId && status === REVIEW) || status === FLY,
    userCanAssignPad: isOfficer || user.id === card.userId,

    canSubmitToLCO: !!card.rsoId && status !== FLY && status !== DONE,
    userCanSubmitToLCO: isOfficer || user.id === card.userId,

    canMarkDone: card.status === FLY && !!card.rsoId,
    userCanMarkDone: isOfficer,

    canDelete: card.status !== DONE,
    userCanDelete: user.id === card.userId,
  };
}

export function PadSelect({
  card,
  ...props
}: { card: iCard } & FormSelectProps) {
  const [pads] = usePads();

  if (!pads) return <Loading wat='pads' />;

  // Group pads by group
  const padGroupEntries = [
    ...arrayGroup(Object.values(pads), pad => pad.group ?? ''),
  ];

  // Sort by group name
  arraySort(padGroupEntries, '0');

  // Sort w/in each group
  for (const [, pads] of padGroupEntries) {
    arraySort(pads, 'name');
  }

  function setPad(e: ChangeEvent<HTMLSelectElement>) {
    const padId = e.currentTarget.value;
    busy(e.currentTarget, updateCard(card, { padId }));
  }

  return (
    <div className='d-flex flex-column text-center'>
      <FormSelect {...props} value={card.padId ?? ''} onChange={setPad}>
        <option value=''>No Pad Selected</option>

        {padGroupEntries.map(([group, pads]) => (
          <optgroup key={group} label={group}>
            {pads.map(pad => (
              <option key={pad.id} value={pad.id}>
                {pad.name}
              </option>
            ))}
          </optgroup>
        ))}
      </FormSelect>
      <div className='text-tip'>Select Launch Pad</div>
    </div>
  );
}

export function WithdrawButton({
  card,
  children,
  ...props
}: { card: iCard } & ButtonProps) {
  return (
    <div className='d-flex flex-column text-center'>
      <Button onClick={() => updateCard(card, { status: DRAFT })} {...props}>
        {children}
      </Button>{' '}
      <div className='text-tip'>
        Temporarily withdraw from safety review and/or launch
      </div>
    </div>
  );
}

export function RSORequestButton({
  card,
  children,
  ...props
}: { card: iCard } & ButtonProps) {
  return (
    <div className='d-flex flex-column text-center'>
      <Button onClick={() => updateCard(card, { status: REVIEW })} {...props}>
        {children}
      </Button>
      <div className='text-tip'>Request safety review</div>
    </div>
  );
}

export function RSOApproveButton({
  card,
  children,
  ...props
}: { card: iCard } & ButtonProps) {
  const [rso] = useCurrentAttendee();
  if (!rso) return null;
  return (
    <div className='d-flex flex-column text-center'>
      <Button
        onClick={() => updateCard(card, { status: DRAFT, rsoId: rso.id })}
        {...props}
      >
        {children}
      </Button>
      <div className='text-tip'>Approve for launch</div>
    </div>
  );
}

export function RSORejectButton({
  card,
  children,
  ...props
}: { card: iCard } & ButtonProps) {
  const [rso] = useCurrentAttendee();
  if (!rso) return null;
  return (
    <div className='d-flex flex-column text-center'>
      <Button
        onClick={() => updateCard(card, { status: DRAFT, rsoId: DELETE })}
        {...props}
      >
        {children}
      </Button>
      <div className='text-tip'>Revoke RSO approval</div>
    </div>
  );
}

export function LCORequestButton({
  card,
  children,
  ...props
}: { card: iCard } & ButtonProps) {
  return (
    <div className='d-flex flex-column text-center'>
      <Button onClick={() => updateCard(card, { status: FLY })} {...props}>
        {children}
      </Button>

      <div className='text-tip'>Ready for launch!</div>
    </div>
  );
}

export function LCOFinishButton({
  card,
  children,
  ...props
}: { card: iCard } & ButtonProps) {
  const [attendee] = useCurrentAttendee();
  if (!attendee) return null;
  return (
    <div className='d-flex flex-column text-center'>
      <Button
        onClick={() => updateCard(card, { status: DONE, lcoId: attendee.id })}
        {...props}
      >
        {children}
      </Button>

      <div className='text-tip'>Flight complete (locks card!)</div>
    </div>
  );
}

export function DeleteButton({
  card,
  children,
  ...props
}: { card: iCard } & ButtonProps) {
  const [attendee] = useCurrentAttendee();
  const navigate = useNavigate();
  if (!attendee) return null;

  async function deleteCard() {
    const reallyMsg = `Delete flight card for '${
      card.rocket?.name ?? '(unnamed rocket)'
    }'? (This cannot be undone!)`;

    if (!confirm(reallyMsg)) {
      return;
    }

    const rtPath = CARD_PATH.with({ launchId: card.launchId, cardId: card.id });
    await rtRemove(rtPath);
    flash('Flight card deleted');
    navigate(-1);
  }

  return (
    <div className='d-flex flex-column text-center'>
      <Button onClick={deleteCard} {...props}>
        {children}
      </Button>

      <div className='text-tip'>Are you sure?!?</div>
    </div>
  );
}
