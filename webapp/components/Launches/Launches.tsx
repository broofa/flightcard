import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { isMock } from '../Admin/MockDB';
import { useCurrentUser, useLaunches } from '../contexts/rt_hooks';
import { CreateLaunchModal } from './CreateLaunchModal';
import EventCard from './EventCard';
import { cn, Loading } from '/components/common/util';

export default function Launches() {
  const [launches, launchesLoading] = useLaunches();
  const [currentUser] = useCurrentUser();
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  if (!currentUser) return <Loading wat='Current User' />;
  if (launchesLoading) return <Loading wat='Launches' />;

  return (
    <>
      {showLaunchModal ? (
        <CreateLaunchModal
          show={true}
          onHide={() => setShowLaunchModal(false)}
        />
      ) : null}

      <div className='d-flex mb-3'>
        <h2 className='flex-grow-1 my-0'>
          {launches ? 'Current and Upcoming Launches' : 'No Launches Found'}
        </h2>
        <Button
          className='flex-grow-0'
          size='sm'
          onClick={() => setShowLaunchModal(true)}
        >
          New Launch ...
        </Button>
      </div>
      {launches ? (
        <>
          <p className=''>
            <span className='fw-bold'>'Just here to explore the app?</span>{' '}
            Check into one of the "<span className='mock'>Test</span>" launches
            to see what a launch with plenty of people and flights looks like.
          </p>
          <div className='deck'>
            {Object.values(launches)
              .filter(
                (l) =>
                  !l.startDate ||
                  Date.parse(`${l.endDate}T23:59:59`) >= Date.now()
              )
              .map((l) => (
                <EventCard
                  key={l.id}
                  launch={l}
                  className={cn({ 'mock-badge': isMock(l) })}
                />
              ))}
          </div>
          <h2>Past Launches</h2>
          <div className='deck'>
            {Object.values(launches)
              .filter((l) => Date.parse(`${l.endDate}T23:59:59`) < Date.now())
              .map((l) => (
                <EventCard
                  key={l.id}
                  launch={l}
                  className={cn({ 'mock-badge': isMock(l) })}
                />
              ))}
          </div>
        </>
      ) : (
        <p>
          This is rather unexpected. Try clicking the "New Launch" button and
          let's see what happens...?
        </p>
      )}
    </>
  );
}
