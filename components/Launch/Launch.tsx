import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import {
  Location as RouterLocation,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import CardEditor from '../Cards/CardEditor';
import CardSummary from '../Cards/CardSummary';
import { useCurrentAttendee, useLaunch } from '../contexts/rt_hooks';
import ProfilePage from '../Profile/ProfilePage';
import Stats from '../Stats/Stats';
import { CardsPane } from './CardsPane';
import { LCOPane } from './LCOPane';
import { RSOPane } from './RSOPane';
import { UsersPane } from './UsersPane';
import { Loading } from '/components/common/util';
import { LaunchCard } from '/components/Launch/LaunchCard';
import LaunchEditor from '/components/LaunchEditor/LaunchEditor';
import { iAttendees, iCard } from '/types';
import { arraySort } from '/util/arrayUtils';
import { useRoleAPI } from '../contexts/officer_hooks.js';
import { LAUNCH_RIDEALONG_PATH } from '/rt/rtconstants.js';
import { rtSet, useRTValue } from '/rt/index.js';

export function CardList({
  cards,
  attendees,
}: {
  cards: iCard[];
  attendees?: iAttendees;
}) {
  if (attendees) {
    arraySort(cards, card => attendees[card.userId].name);
  } else {
    arraySort(cards, card => card.rocket?.name);
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

function Launch() {
  const location = useLocation();
  const roleApi = useRoleAPI();
  const [launch] = useLaunch();
  const rtPath = LAUNCH_RIDEALONG_PATH.with({ launchId: launch?.id ?? '' });
  const [ridealongPath] = useRTValue<string>(rtPath);
  const [currentAttendee, currentAttendeeLoading] = useCurrentAttendee();

  // Capture and publish navigation events for the "LCO ride along" feature
  useEffect(() => {
    console.log(currentAttendee?.role);
    if (launch && roleApi.isLCO(currentAttendee)) {
      console.log('Publishing navigation', location.pathname);
      rtSet<string>(rtPath, location.pathname).catch(err =>
        console.error('Error publishing navigation', err)
      );
    }
  }, [location, launch, currentAttendee, roleApi, rtPath]);

  if (!currentAttendee && currentAttendeeLoading)
    return <Loading wat='User (Launch)' />;

  // Override location for LCO ride along
  let path: RouterLocation | string | undefined = location;
  if (
    !roleApi.isLCO(currentAttendee) &&
    /\/ridealong$/.test(location.pathname)
  ) {
    path = ridealongPath;
  }

  return (
    <>
      <Routes location={path}>
        <Route path='cards' element={<CardsPane />} />
        <Route path='cards/:cardId' element={<CardEditor />} />
        <Route path='cards/:cardId/summary' element={<CardSummary />} />
        <Route path='edit' element={<LaunchEditor />} />
        <Route path='profile' element={<ProfilePage />} />
        <Route path='report' element={<Stats />} />
        <Route path='rso' element={<RSOPane />} />
        <Route path='lco' element={<LCOPane />} />
        <Route path='users/:filter' element={<UsersPane />} />
        <Route
          path='*'
          element={<Alert variant='warning'>Page not found</Alert>}
        />
      </Routes>
    </>
  );
}

export default Launch;
