import { nanoid } from 'nanoid';
import React from 'react';
import { Button } from 'react-bootstrap';
import { clear, log } from './AdminLogger';
import Busy from './Busy';
import { util } from '/rt';
import {
  ATTENDEES_INDEX_PATH,
  ATTENDEE_PATH,
  CARDS_INDEX_PATH,
  CARD_MOTORS_PATH,
} from '/rt/rtconstants';
import { iAttendees, iCards } from '/types';

async function completed_migrateCerts() {
  log(<h3>Migrating attendee certs...</h3>);
  const allAttendees = await util.get<Record<string, iAttendees>>(
    ATTENDEES_INDEX_PATH
  );
  for (const [launchId, attendees] of Object.entries(allAttendees)) {
    log(<h4>{launchId}</h4>);
    for (const [userId, attendee] of Object.entries(attendees)) {
      const cert = attendee.cert;
      if (!cert) continue;

      if (cert.memberId != null) {
        // cert.memberId = cert.memberId;
        const rtPath = ATTENDEE_PATH.with({ launchId, userId });
        const p = util.set(rtPath, cert);
        const entry = (
          <div>
            <Busy promise={p} text={`Updating ${rtPath}`} />
          </div>
        );
        log(entry);
      }
    }
  }
}

async function complete_migrateMotors() {
  log(<h3>Migrating cards/:launchId/:cardId/motors...</h3>);
  const allCards = await util.get<Record<string, iCards>>(CARDS_INDEX_PATH);
  for (const [launchId, cards] of Object.entries(allCards)) {
    log(<h4>Launch {launchId}</h4>);
    for (const [cardId, card] of Object.entries(cards)) {
      if (!card.motors) continue;

      const motorEntries = Object.entries(card.motors);
      let needsWrite = false;
      for (const entry of motorEntries) {
        const [motorId, motor] = entry;
        if (motorId != motor.id) {
          if (!motor.id) motor.id = nanoid();
          entry[0] = motor.id;
          needsWrite = true;
        }
      }

      if (needsWrite) {
        const rtPath = CARD_MOTORS_PATH.with({ launchId, cardId });
        log('Updating', rtPath);
        await util.set(rtPath, Object.fromEntries(motorEntries));
      }
    }
  }
}

async function handleClick() {
  clear();
  log(<h2>Starting...</h2>);
  await complete_migrateMotors();
  log(<h2>--- Fin ---</h2>);
}

export default function MigrateDB() {
  return (
    <Button
      variant='warning'
      onClick={() => {
        handleClick().catch(err => {
          log(err);
          console.error(err);
        });
      }}
    >
      Migrate DB
    </Button>
  );
}
