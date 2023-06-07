import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { Route, Routes, RoutesProps, useLocation } from 'react-router-dom';
import CardEditor from '../Cards/CardEditor';
import CardSummary from '../Cards/CardSummary';
import LaunchEditor from '../LaunchEditor/LaunchEditor';
import ProfilePage from '../Profile/ProfilePage';
import Stats from '../Stats/Stats';
import { Loading } from '../common/util';
import { useRoleAPI } from '../contexts/officer_hooks';
import { useCurrentAttendee, useLaunch } from '../contexts/rt_hooks';
import { CardsPane } from './CardsPane';
import { LCOPane } from './LCOPane';
import { LaunchCard } from './LaunchCard';
import { MEME_SKEPTICAL, Meme } from './Meme';
import { RSOPane } from './RSOPane';
import { UsersPane } from './UsersPane';
import { rtSet, useRTValue } from '/rt';
import { LAUNCH_RIDEALONG_PATH } from '/rt/rtconstants';
import { iAttendees, iCard } from '/types';
import { arraySort } from '/util/arrayUtils';

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

function NotFound({ isLCO, isRiding }: { isLCO: boolean; isRiding: boolean }) {
  if (isRiding) {
    if (isLCO) {
      return (
        <Meme
          meme={MEME_SKEPTICAL}
          topText='An LCO trying to ride-along with themselves?'
          bottomText='That seems like a bad idea'
          style={{ width: '50%' }}
        />
      );
    } else {
      return (
        <Alert variant='warning text-center'>LCO temporarily unavailable</Alert>
      );
    }
  }
  return <Alert variant='warning text-center'>Page Not Found</Alert>;
}

function RideAlongRoutes({ children, ...props }: RoutesProps) {
  let location = useLocation();
  const { pathname } = location;
  const roleApi = useRoleAPI();
  const [launch] = useLaunch();

  const rtPath = LAUNCH_RIDEALONG_PATH.with({ launchId: launch?.id ?? '' });
  const [ridealongPath] = useRTValue<string>(rtPath);
  const [currentAttendee, currentAttendeeLoading] = useCurrentAttendee();

  const isLCO = roleApi.isLCO(currentAttendee);
  const isRiding = /\/ridealong$/.test(pathname);

  // Capture this state here because `launch` changes every time we set the
  // ridealong path, which causes a re-render loop if we have `launch` in the
  // effect dependencies.
  const isRideAlongHost = launch && isLCO && !isRiding;
  const rideAlongPath = launch && isLCO && !isRiding ? pathname : null;

  console.log('ridealongPath', pathname, isRideAlongHost, rtPath);
  // Capture and publish navigation events for the "LCO ride along" feature
  useEffect(() => {
    if (!rideAlongPath) return;
    rtSet<string>(rtPath, rideAlongPath).catch((err: Error) =>
      console.error('ridealong error', err)
    );
  }, [rtPath, rideAlongPath]);

  if (!currentAttendee && currentAttendeeLoading)
    return <Loading wat='User (Launch)' />;

  // Override location if user is doing "LCO ride along"
  if (!isLCO && ridealongPath && isRiding) {
    location = {
      ...location,
      pathname: ridealongPath,
    };
  }

  return (
    <Routes {...props} location={location}>
      <Route
        path='*'
        element={<NotFound isLCO={isLCO} isRiding={isRiding} />}
      />
      {children}
    </Routes>
  );
}

function Launch() {
  return (
    <RideAlongRoutes>
      <Route path='cards' element={<CardsPane />} />
      <Route path='cards/:cardId' element={<CardEditor />} />
      <Route path='cards/:cardId/summary' element={<CardSummary />} />
      <Route path='edit' element={<LaunchEditor />} />
      <Route path='profile' element={<ProfilePage />} />
      <Route path='report' element={<Stats />} />
      <Route path='rso' element={<RSOPane />} />
      <Route path='lco' element={<LCOPane />} />
      <Route path='users/:filter' element={<UsersPane />} />
    </RideAlongRoutes>
  );
}

export default Launch;
