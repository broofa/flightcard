import React from 'react';
import { Button } from 'react-bootstrap';
import { clear, log } from './AdminLogger';
import Busy from './Busy';
import { util } from '/firebase';
import { iAttendees } from '/types';

async function completed_migrateCerts() {
  log(<h3>Migrating attendee certs...</h3>);
  const attendees = await util.get('/attendees');
  for (const [launchId, launchAttendees] of Object.entries<iAttendees>(
    attendees
  )) {
    log(<h4>{launchId}</h4>);
    for (const [attendeeId, attendee] of Object.entries(launchAttendees)) {
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

async function handleClick() {
  clear();
  log(<h2>Starting...</h2>);
  await completed_migrateCerts();
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
