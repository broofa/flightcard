import React from 'react';
import { Button } from 'react-bootstrap';
import { clear, log } from './AdminLogger';
import { randomId } from '/components/common/util';
import { DELETE, rtGet, rtSet, rtTransaction } from '/rt';
import {
  CARDS_INDEX_PATH,
  CARD_MOTORS_PATH,
  CARD_PATH
} from '/rt/rtconstants';
import { iCards } from '/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function complete_migrateMotors() {
  log(<h3>Migrating cards/:launchId/:cardId/motors...</h3>);
  const allCards = await rtGet<Record<string, iCards>>(CARDS_INDEX_PATH);
  for (const [launchId, cards] of Object.entries(allCards)) {
    log(<h4>Launch {launchId}</h4>);
    for (const [cardId, card] of Object.entries(cards)) {
      if (!card.motors) continue;

      const motorEntries = Object.entries(card.motors);
      let needsWrite = false;
      for (const entry of motorEntries) {
        const [motorId, motor] = entry;
        if (motorId != motor.id) {
          if (!motor.id) motor.id = randomId();
          entry[0] = motor.id;
          needsWrite = true;
        }
      }

      if (needsWrite) {
        const rtPath = CARD_MOTORS_PATH.with({ launchId, cardId });
        log('Updating', rtPath);
        await rtSet(rtPath, Object.fromEntries(motorEntries));
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function migrateCardStatus() {
  log(<h3>Migrating cards/:launchId/:cardId/motors...</h3>);
  const allCards = await rtGet<Record<string, iCards>>(CARDS_INDEX_PATH);
  const transaction = rtTransaction();
  for (const [launchId, cards] of Object.entries(allCards)) {
    log(<h4>Launch {launchId}</h4>);
    for (const [cardId, card] of Object.entries(cards)) {
      const status =
        {
          undefined: 'draft',
          draft: 'draft',
          0: 'draft',

          1: 'review',
          review: 'review',

          ready: 'fly',
          2: 'fly',
          fly: 'fly',

          3: 'done',
          done: 'done',
        }[card.status as string] ?? DELETE;

      if (status === card.status) continue;

      const rtPath = CARD_PATH.append('status').with({ launchId, cardId });
      log('Updating', rtPath.toString(), card.status, '=>', status);

      // transaction.update<string>(rtPath, status);
    }
    await transaction.commit();
  }
}

async function handleClick() {
  clear();
  log(<h2>Starting...</h2>);
  // await migratePadLaunchId();
  log(<h2>--- Fin ---</h2>);
}

export default function MigrateDB() {
  return (
    <Button
      variant='warning'
      onClick={() => {
        handleClick().catch((err) => {
          log(err);
          console.error(err);
        });
      }}
    >
      Migrate DB
    </Button>
  );
}
