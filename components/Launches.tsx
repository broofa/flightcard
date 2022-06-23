import { nanoid } from 'nanoid';
import React, { MouseEventHandler, useState } from 'react';
import {
  Button,
  Card,
  CardProps,
  FormSelect,
  Modal,
  ModalProps,
} from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { arraySort } from '../util/arrayUtils';
import { APPNAME } from './App/App';
import { useCurrentUser, useLaunches } from './contexts/rthooks';
import { busy, LinkButton, Loading } from '/components/common/util';
import { db } from '/rt';
import { iLaunch, iPad } from '/types';

function dateString(ts: string) {
  return new Date(`${ts}T00:00:00`).toLocaleDateString();
}

function EventCard({ launch, ...props }: { launch: iLaunch } & CardProps) {
  return (
    <Card key={launch.id} {...props}>
      <Card.Body>
        <Card.Title>{launch.name}</Card.Title>
        <div>
          Dates: {dateString(launch.startDate)} - {dateString(launch.endDate)}
        </div>
        <div>Location: {launch.location}</div>
        <div>Host: {launch.host}</div>
        <LinkButton className='mt-2' to={`/launches/${launch.id}`}>
          Check into {launch.name}
        </LinkButton>
      </Card.Body>
    </Card>
  );
}

function CreateLaunchModal(props: ModalProps & { onHide: () => void }) {
  const [launches] = useLaunches();
  const [currentUser] = useCurrentUser();
  const [copyId, setCopyId] = useState('');
  const navigate = useNavigate();

  if (!currentUser) return <Loading wat='User' />;
  if (!launches) return <Loading wat='Launches' />;

  const createLaunch: MouseEventHandler = async e => {
    const target = e.target as HTMLButtonElement;
    const launchId = nanoid();

    // Hide modal so button can't get clicked twice by mistake
    target.disabled = true;

    // Create launch object
    const newLaunch: Partial<iLaunch> = {
      id: launchId,
      name: 'New Launch',
    };

    // Copy properties if needed
    const src = launches[copyId];
    if (src) {
      newLaunch.host = src.host;
      newLaunch.location = src.location;
    }

    // Save launch
    await busy(target, db.launch.set(newLaunch.id, newLaunch as iLaunch));

    // Make current user the first officer
    await busy(target, db.officer.set(launchId, currentUser.id, true));

    // Copy launch pads
    if (src) {
      const pads = await db.pads.get(src.id);
      const newPads: { [padId: string]: iPad } = {};
      for (const pad of Object.values(pads)) {
        pad.id = nanoid();
        pad.launchId = launchId;
        newPads[pad.id] = pad;
      }
      await busy(target, db.pads.set(launchId, newPads));
    }

    navigate(`/launches/${launchId}/edit`);
  };

  return (
    <Modal {...props}>
      <Modal.Header closeButton>
        <Modal.Title>New Launch</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Has your club used {APPNAME} previously?  If so, you can select one of your previous launches below to copy the host, location, and pad
          configuration to your new launch.
        </p>

        <p className='text-tip'>
          ... or just click "Create Launch" to start with a fresh, new launch! :-)
        </p>

        <FormSelect
          className='mt-3'
          value={copyId}
          onChange={e => setCopyId(e.target.value)}
        >
          <option>(Optional) Launch to copy...</option>
          {arraySort(Object.values(launches), 'name').map(launch => (
            <option key={launch.id} value={launch.id}>
              {launch.name}
            </option>
          ))}
        </FormSelect>
      </Modal.Body>

      <Modal.Footer>
        <Button variant='secondary' onClick={props.onHide}>
          Cancel
        </Button>
        <Button onClick={createLaunch}>Create Launch</Button>
      </Modal.Footer>
    </Modal>
  );
}

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
