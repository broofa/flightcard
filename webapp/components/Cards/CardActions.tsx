import type { ModalProps } from 'react-bootstrap';
import { useIsOfficer } from '../contexts/officer_hooks';
import { useCurrentAttendee } from '../contexts/rt_hooks';
import {
  DeleteButton,
  LCOFinishButton,
  LCORequestButton,
  PadSelect,
  RSOApproveButton,
  RSORejectButton,
  RSORequestButton,
  WithdrawButton,
  getCardPermissions,
} from './CardEditorButtons';
import type { iCard } from '/types';

export function CardActions({
  card,
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
      <div
        className='d-grid'
        style={{
          gap: '.5em 1em',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12em, 1fr)',
        }}
      >
        {perms.userCanWithdraw ? (
          <WithdrawButton disabled={!perms.canWithdraw} card={card}>
            Withdraw
          </WithdrawButton>
        ) : null}

        {perms.userCanAssignPad ? (
          <PadSelect disabled={!perms.canWithdraw} card={card} />
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
          <RSORejectButton
            variant='warning'
            disabled={!perms.canReject}
            card={card}
          >
            Reject
          </RSORejectButton>
        ) : null}

        {perms.userCanSubmitToLCO ? (
          <LCORequestButton disabled={!perms.canSubmitToLCO} card={card}>
            Submit to LCO
          </LCORequestButton>
        ) : null}

        {perms.userCanMarkDone ? (
          <LCOFinishButton disabled={!perms.canMarkDone} card={card}>
            All Done
          </LCOFinishButton>
        ) : null}
        {perms.userCanDelete ? (
          <DeleteButton
            className='mx-5'
            disabled={!perms.canDelete}
            variant='danger'
            card={card}
          >
            Delete
          </DeleteButton>
        ) : null}
      </div>
    </>
  );
}
