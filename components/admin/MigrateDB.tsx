import { nanoid } from 'nanoid';
import React from 'react';
import { Button } from 'react-bootstrap';
import { clear, log } from './AdminLogger';
import Busy from './Busy';
import { util } from '/firebase';
import { iAttendees, iCards } from '/types';

async function completed_migrateCerts() {
  log(<h3>Migrating attendee certs...</h3>);
  const allAttendees = await util.get<Record<string, iAttendees>>('/attendees');
  for (const [launchId, attendees] of Object.entries(allAttendees)) {
    log(<h4>{launchId}</h4>);
    for (const [attendeeId, attendee] of Object.entries(attendees)) {
      const cert = attendee.cert as any;
      if (!cert) continue;

      if (cert.memberId != null) {
        // cert.memberId = cert.memberId;
        const dbPath = `/attendees/${launchId}/${attendeeId}/cert`;
        const p = util.set(dbPath, cert);
        const entry = (
          <div>
            <Busy promise={p} text={`Updating ${dbPath}`} />
          </div>
        );
        log(entry);
      }
    }
  }
}

async function complete_migrateMotors() {
  log(<h3>Migrating cards/:launchId/:cardId/motors...</h3>);
  const allCards = await util.get<Record<string, iCards>>('/cards');
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
        const rtPath = `/cards/${launchId}/${cardId}/motors`;
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
