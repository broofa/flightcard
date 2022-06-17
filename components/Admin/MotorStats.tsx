import React from 'react';
import { Button } from 'react-bootstrap';
import { clear, log } from './AdminLogger';
import { util } from '/firebase';
import { iCards } from '/types';
import { getMotor } from '/util/motor-util';
import { sortArray } from '/util/sortArray';

async function handleClick() {
  clear();
  log(<h3>Fetching cards...</h3>);
  const allCards = await util.get<Record<string, iCards>>('/cards');
  const motorCounts: { [tcMotorId: string]: number } = {};
  for (const [launchId, cards] of Object.entries(allCards)) {
    log(<h4>Launch {launchId}</h4>);
    for (const card of Object.values(cards)) {
      if (!card.motors) continue;

      for (const { tcMotorId } of Object.values(card.motors)) {
        if (!tcMotorId) continue;
        motorCounts[tcMotorId] = (motorCounts[tcMotorId] ?? 0) + 1;
      }
    }
  }

  const counts = sortArray(
    Object.entries(motorCounts),
    ([, count]) => count
  ).reverse();

  for (const [tcMotorId, count] of counts) {
    const tcMotor = getMotor(tcMotorId);
    log(count, tcMotor?.manufacturerAbbrev, tcMotor?.commonName);
  }
}

export default function MotorStats() {
  return (
    <Button
      variant='info'
      onClick={() => {
        handleClick().catch(err => {
          log(err);
          console.error(err);
        });
      }}
    >
      Motor Stats
    </Button>
  );
}
