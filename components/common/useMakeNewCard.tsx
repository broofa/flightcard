import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useLaunch } from '../contexts/rthooks';
import { rtSet } from '/rt';
import { CARD_PATH } from '/rt/rtconstants';
import { CardStatus, iCard } from '/types';

// This doesn't feel like the right way of doing this, but wrapping this logic
// in a hook avoids copy/pasting code around, and the mistakes that come with
// that. :-/
export function useMakeNewCard() {
  const [launch] = useLaunch();
  const [currentUser] = useCurrentUser();
  const navigate = useNavigate();

  const launchId = launch?.id;
  const userId = currentUser?.id;

  function gotoNewCard() {
    // Launch or user hasn't loaded yet?
    if (!launchId || !userId) return;

    const card: iCard = {
      id: nanoid(),
      status: CardStatus.DRAFT,
      launchId,
      userId,
    };
    const rtpath = CARD_PATH.with({ launchId: card.launchId, cardId: card.id });
    return rtSet(rtpath, card).then(() =>
      navigate(`/launches/${card.launchId}/cards/${card.id}`)
    );
  }

  return gotoNewCard;
}
