import React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { flash } from '../common/Flash';
import { useCurrentAttendee } from '../contexts/rthooks';
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
        notes.push('When ready for safety review, click "Submit to RSO"');
      } else if (!card.padId) {
        notes.push(
          'Talk to Launch Control about how pads are assigned.  Once you have a pad assignment and are ready to launch, click "Submit to LCO".'
        );
      }
      break;

    case REVIEW:
    case FLY:
      if (!card.rsoId) {
        warnings.push('Next Step: Present rocket to the Range Safety Officer.');
        if (isOfficer && user.id === card.userId) {
          notes.push(
            '(FYI, officers are not allowed to RSO their own rockets)'
          );
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
        <span className='text-tip'>
          'Remember, cards submitted to the LCO or RSO cannot be changed. Click
          "Unsubmit" to make changes.'
        </span>
      );
      break;

    case DONE:
      notes.push('This card has been flown and is no longer editable.');
      break;
  }

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

export function RSOWithdrawButton({
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
        Withdraw RSO request so flyer can make changes
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
      <div className='text-tip'>Approve card for flight</div>
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
      <div className='text-tip'>Rescind RSO approval</div>
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

      <div className='text-tip'>Ask LCO to launch this puppy!</div>
    </div>
  );
}

export function LCOCompleteButton({
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

      <div className='text-tip'>Archives card (cannot be undone!)</div>
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
