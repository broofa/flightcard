import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useCurrentUser, useLaunches } from '../contexts/rthooks';
import { CreateLaunchModal } from './CreateLaunchModal';
import EventCard from './EventCard';
import { Loading } from '/components/common/util';

export default function Launches() {
  const [launches] = useLaunches();
  const [currentUser] = useCurrentUser();
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  if (!currentUser) return <Loading wat='User (Launches)' />;
  if (!launches) return <Loading wat='Launches' />;

  return (
    <>
      {showLaunchModal ? (
        <CreateLaunchModal
          show={true}
          onHide={() => setShowLaunchModal(false)}
        />
      ) : null}

      <div className='d-flex mb-3'>
        <h2 className='flex-grow-1 my-0'>Current and Upcoming Launches</h2>
        <Button
          className='flex-grow-0'
          size='sm'
          onClick={() => setShowLaunchModal(true)}
        >
          New Launch ...
        </Button>
      </div>
      <div className='text-tip mb-2'>
        NOTE: "(test)" launches are periodically reset. If you're here to just play with the app, feel free to check into one of these and muck about. You won't hurt anything.
      </div>
      <div className='deck'>
        {Object.values(launches)
          .filter(
            l =>
              !l.startDate || Date.parse(`${l.endDate}T23:59:59`) >= Date.now()
          )
          .map(l => (
            <EventCard key={l.id} launch={l} />
          ))}
      </div>

      <h2>Past Launches</h2>
      <div className='deck'>
        {Object.values(launches)
          .filter(l => Date.parse(`${l.endDate}T23:59:59`) < Date.now())
          .map(l => (
            <EventCard key={l.id} launch={l} />
          ))}
      </div>
    </>
  );
}
