import React, { HTMLAttributes, useContext } from 'react';
import { Alert, ButtonGroup } from 'react-bootstrap';
import {
  Link,
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams,
} from 'react-router-dom';
import { db } from '../firebase';
import { iAttendee, iAttendees, iCard, iPerm } from '../types';
import { sortArray } from '../util/sortArray';
import { ANONYMOUS, AppContext } from './App';
import CardEditor from './CardEditor';
import { CardsPane } from './CardsPane';
import { CertDot } from './common/CertDot';
import { LinkButton, Loading } from './common/util';
import { LaunchCard } from './LaunchCard';
import LaunchEditor from './LaunchEditor';
import LaunchHome from './LaunchHome';
import ProfilePage from './ProfilePage';
import { UserList } from './UserList';
import { Waiver } from './Waiver';

export const OFFICERS = 'officers';
export const LOW_POWER = 'low';
export const HIGH_POWER = 'high';

function officerUsers(user?: iAttendee, isOfficer?: iPerm) {
  return isOfficer ?? false;
}

function lowPowerUsers(user: iAttendee) {
  return (user.cert?.level ?? 0) == 0;
}

function highPowerUsers(user: iAttendee) {
  return (user.cert?.level ?? 0) > 0;
}

function UsersPane({ launchId }: { launchId: string }) {
  const location = useLocation();
  const filter = new URLSearchParams(location.search).get('filter');

  let title, userFilter;
  switch (filter) {
    case OFFICERS:
      title = '\u2605 Officers';
      userFilter = officerUsers;
      break;
    case LOW_POWER:
      title = 'Low Power Attendees';
      userFilter = lowPowerUsers;
      break;
    case HIGH_POWER:
      title = 'High Power Attendees';
      userFilter = highPowerUsers;
      break;
    default:
      title = 'All Attendees';
      break;
  }

  return (
    <>
      <ButtonGroup className='mt-2'>
        <LinkButton isActive={() => !filter} to={`/launches/${launchId}/users`}>
          All
        </LinkButton>
        <LinkButton
          isActive={() => filter == OFFICERS}
          to={`/launches/${launchId}/users?filter=${OFFICERS}`}
        >
          {'\u2605'}
        </LinkButton>
        <LinkButton
          isActive={() => filter == LOW_POWER}
          to={`/launches/${launchId}/users?filter=${LOW_POWER}`}
        >
          LP
        </LinkButton>
        <LinkButton
          isActive={() => filter == HIGH_POWER}
          to={`/launches/${launchId}/users?filter=${HIGH_POWER}`}
        >
          HP
        </LinkButton>
      </ButtonGroup>

      <UserList launchId={launchId} filter={userFilter}>
        {title}
      </UserList>
    </>
  );
}

export function CardList({
  cards,
  attendees,
}: {
  cards: iCard[];
  attendees?: iAttendees;
}) {
  if (attendees) {
    sortArray(cards, card => attendees[card.userId].name);
  } else {
    sortArray(cards, card => card.rocket?.name);
  }

  return (
    <div className='deck'>
      {cards.map(card => (
        <LaunchCard
          key={card.id}
          card={card}
          attendee={attendees?.[card.userId]}
        />
      ))}
    </div>
  );
}

function RangeSafetyPane() {
  const { cards, attendees } = useContext(AppContext);

  if (!attendees) return <Loading wat='Users' />;

  const rsoCards = Object.values(cards || {}).filter(c => c.status == 'review');

  return (
    <>
      <h2>RSO Requests</h2>
      {rsoCards?.length ? (
        <CardList cards={rsoCards} attendees={attendees} />
      ) : (
        <Alert variant='secondary'>No RSO requests at this time.</Alert>
      )}
    </>
  );
}

function PadName({
  children,
  className = '',
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`flex-grow-0 px-1 bg-dark text-light text-center ${className}`}
      style={{ minWidth: '2em' }}
    >
      {children}
    </span>
  );
}

function PadCard({ padId }: { padId: string }) {
  const { launch, cards, attendees } = useContext(AppContext);
  const history = useHistory();
  const pad = db.pad.useValue(launch?.id, padId);

  const padCards = cards
    ? Object.values(cards).filter(c => c.padId == padId && c.status == 'ready')
    : [];

  if (!pad) return <Loading wat='Pad' />;

  const padCardClasses = 'card text-center flex-column';

  if (padCards.length <= 0) {
    // No cards assigned
    return (
      <div className={`${padCardClasses} border-dark`} style={{ opacity: 0.4 }}>
        <div className='d-flex' style={{ fontSize: '1.3em' }}>
          <PadName>{pad.name}</PadName>
          <span className='flex-grow-1' />
        </div>
      </div>
    );
  } else if (padCards.length > 1) {
    // Pad conflict (too many cards)
    return (
      <div className={`${padCardClasses} border-danger`}>
        <div className='d-flex' style={{ fontSize: '1.3rem' }}>
          <PadName className='bg-danger'>{pad.name}</PadName>
          <span className='bg-danger text-white text-center flex-grow-1 fst-italic'>
            Pad Conflict
          </span>
        </div>

        <div className='p-2'>
          Cards assigned to this pad:
          {padCards.map(c => {
            const flier = attendees?.[c.userId];
            return (
              flier && (
                <Link
                  key={c.id}
                  className='mx-2'
                  to={`/launches/${c.launchId}/cards/${c.id}`}
                >
                  {flier.name ?? ANONYMOUS}
                </Link>
              )
            );
          })}
        </div>
      </div>
    );
  }

  const card = padCards[0];
  const attendee = attendees?.[card.userId];

  return (
    <div
      onClick={() =>
        history.push(`/launches/${card.launchId}/cards/${card.id}`)
      }
      className={`${padCardClasses} border-dark cursor-pointer`}
    >
      <div className='d-flex' style={{ fontSize: '1.3rem' }}>
        <PadName>{pad.name}</PadName>
        {attendee ? (
          <div className={'d-flex align-items-center flex-grow-1'}>
            <span className='flex-grow-1 ms-2 my-0 h3'>
              {attendee?.name ?? ANONYMOUS}
            </span>
            <CertDot
              className='mx-1 flex-grow-0'
              style={{ fontSize: '1rem' }}
              cert={attendee.cert}
            />
          </div>
        ) : (
          <span className='flex-grow-1' />
        )}
      </div>

      <div className='p-2'>
        {card?.rocket ? (
          <>
            <div>{card.rocket?.name ?? ''}</div>
            <div className='fw-bold'>
              {(card?.motors?.length ?? 0) > 1
                ? '(complex)'
                : card?.motors?.[0]?.name}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function LaunchControlPane() {
  const { pads } = useContext(AppContext);

  if (!pads) return <Loading wat='Pads' />;

  const padGroups = Array.from(
    new Set(Object.values(pads).map(pad => pad.group ?? ''))
  ).sort();

  return (
    <>
      {padGroups.map(group => (
        <div key={group}>
          {group ? <h2 className='mt-5'>{group}</h2> : null}
          <div className='deck ms-3'>
            {sortArray(
              Object.values(pads).filter(pad => (pad.group ?? '') === group),
              'name'
            ).map((pad, i) => (
              <PadCard key={i} padId={pad.id} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function Launch() {
  const { currentUser } = useContext(AppContext);
  const params = useParams<{ launchId: string }>();

  const { launchId } = params;
  const attendee = db.attendee.useValue(launchId, currentUser?.id);

  if (!currentUser) return <Loading wat='User (Launch)' />;

  function WaiverRoute(props) {
    if (!launchId || !attendee) return <Waiver />;
    return <Route {...props} />;
  }

  return (
    <>
      <Switch>
        <WaiverRoute exact path={'/launches/:launchId/cards'}>
          <CardsPane launchId={launchId} />
        </WaiverRoute>

        <WaiverRoute path={'/launches/:launchId/cards/:cardId'}>
          <CardEditor />
        </WaiverRoute>

        <Route path={'/launches/:launchId/edit'}>
          <LaunchEditor />
        </Route>

        <WaiverRoute path={'/launches/:launchId/profile'}>
          <ProfilePage user={attendee} launchId={launchId} />
        </WaiverRoute>

        <WaiverRoute path={'/launches/:launchId/rso'}>
          <RangeSafetyPane />
        </WaiverRoute>

        <WaiverRoute path={'/launches/:launchId/lco'}>
          <LaunchControlPane />
        </WaiverRoute>

        <WaiverRoute path={'/launches/:launchId/users'}>
          <UsersPane launchId={launchId} />
        </WaiverRoute>

        <WaiverRoute path={'/launches/:launchId/'}>
          <LaunchHome />
        </WaiverRoute>
      </Switch>
    </>
  );
}

export default Launch;
