import React from 'react';
import { ModalProps } from 'react-bootstrap';
import { useIsOfficer } from '../contexts/OfficersContext';
import { useCurrentAttendee } from '../contexts/rthooks';
import {
  DeleteButton,
  getCardPermissions,
  LCOCompleteButton,
  LCORequestButton,
  RSOApproveButton,
  RSORejectButton,
  RSORequestButton,
  RSOWithdrawButton,
} from './CardEditorButtons';
import { iCard } from '/types';

export function CardActions({
  card,
  ...props
}: {
  card: iCard;
} & ModalProps) {
  const [attendee] = useCurrentAttendee();
  const isOfficer = useIsOfficer();

  if (!attendee) return null;

  const perms = getCardPermissions(card, attendee, isOfficer);

  // Comment out to see buttons a user *might* be able to click
  perms.userCanApprove &&= perms.canApprove;
  perms.userCanAssignPad &&= perms.canAssignPad;
  perms.userCanMarkDone &&= perms.canMarkDone;
  perms.userCanReject &&= perms.canReject;
  perms.userCanSubmitToLCO &&= perms.canSubmitToLCO;
  perms.userCanSubmitToRSO &&= perms.canSubmitToRSO;
  perms.userCanWithdraw &&= perms.canWithdraw;
  perms.userCanDelete &&= perms.canDelete;

  return (
    <>
      {
        <ul>
          {[...perms.notes, ...perms.warnings].map((note, i) => (
            <li key={`note-${i}`}>{note}</li>
          ))}
        </ul>
      }{' '}
      <div className='deck'>
        {perms.userCanWithdraw ? (
          <RSOWithdrawButton disabled={!perms.canWithdraw} card={card}>
            Withdraw
          </RSOWithdrawButton>
        ) : null}

        {perms.userCanSubmitToRSO ? (
          <RSORequestButton disabled={!perms.canSubmitToRSO} card={card}>
            Submit to RSO
          </RSORequestButton>
        ) : null}

        {perms.userCanApprove ? (
          <RSOApproveButton disabled={!perms.canApprove} card={card}>
            Approve
          </RSOApproveButton>
        ) : null}

        {perms.userCanReject ? (
          <RSORejectButton disabled={!perms.canReject} card={card}>
            Reject
          </RSORejectButton>
        ) : null}

        {perms.userCanSubmitToLCO ? (
          <LCORequestButton disabled={!perms.canSubmitToLCO} card={card}>
            Submit to LCO
          </LCORequestButton>
        ) : null}

        {perms.userCanMarkDone ? (
          <LCOCompleteButton disabled={!perms.canMarkDone} card={card}>
            Archive
          </LCOCompleteButton>
        ) : null}
      </div>
      {perms.userCanDelete ? (
        <DeleteButton
          className='mt-5'
          disabled={!perms.canDelete}
          variant='danger'
          card={card}
        >
          Delete Card
        </DeleteButton>
      ) : null}
    </>
  );
}
