import { CardStatus, type iCard, type iMotor } from '../../types';
import { useCards } from '../contexts/rt_hooks';

export function useFlownCards() {
  const [cards] = useCards();

  if (!cards) return [];

  return Object.values(cards).filter((card) => card.status === CardStatus.DONE);
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
