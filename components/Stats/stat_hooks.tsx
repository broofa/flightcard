import { useCards } from '../contexts/rthooks';
import { CardStatus, iCard, iMotor } from '/types';

export function useFlownCards() {
  const [cards] = useCards();

  if (!cards) return [];

  return Object.values(cards).filter(card => card.status === CardStatus.DONE);
}

export function cardMotors(cards: iCard[]) {
  if (!cards) return [];

  const motors: iMotor[] = [];
  for (const card of cards) {
    if (!card.motors) continue;
    motors.push(...Object.values(card.motors));
  }

  return motors;
}
