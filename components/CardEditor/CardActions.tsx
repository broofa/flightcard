import React from 'react';
import { ModalProps } from 'react-bootstrap';
import { useIsOfficer } from '../contexts/OfficersContext';
import { useCurrentAttendee } from '../contexts/rthooks';
import {
  DeleteButton,
  DoneButton,
  getCardPermissions,
  RSOApproveButton,
  RSORejectButton,
  SubmitToLCO,
  SubmitToRSOButton,
  WithdrawButton,
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

  // Uncomment to see buttons a user *might* be able to click
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
          <WithdrawButton disabled={!perms.canWithdraw} card={card}>
            Unsubmit (To Make Changes)
          </WithdrawButton>
        ) : null}

        {perms.userCanSubmitToRSO ? (
          <SubmitToRSOButton disabled={!perms.canSubmitToRSO} card={card}>
            Submit to RSO
          </SubmitToRSOButton>
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
          <SubmitToLCO disabled={!perms.canSubmitToLCO} card={card}>
            Submit to LCO
          </SubmitToLCO>
        ) : null}

        {perms.userCanMarkDone ? (
          <DoneButton disabled={!perms.canMarkDone} card={card}>
            Archive
          </DoneButton>
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
