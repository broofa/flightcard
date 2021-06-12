import { nanoid } from 'nanoid';
import React, { useContext, useState } from 'react';
import { Button, Card, CardProps, FormSelect, Modal } from 'react-bootstrap';
import { useHistory } from 'react-router';
import { db } from '../firebase';
import { iLaunch } from '../types';
import { sortArray } from '../util/sortArray';
import { AppContext } from './App';
import { busy, LinkButton, Loading } from './common/util';

function dateString(ts) {
  return new Date(`${ts}T00:00:00`).toLocaleDateString();
}

function EventCard({ launch, ...props } : {launch : iLaunch} & CardProps) {
  return <Card key={launch.id} {...props}>
    <Card.Body>
      <Card.Title >{launch.name}</Card.Title>
      <div>Dates: {dateString(launch.startDate)} - {dateString(launch.endDate)}</div>
      <div>Location: {launch.location}</div>
      <div>Host: {launch.host}</div>
      <LinkButton className='mt-2' to={`/launches/${launch.id}`}>
        Check into {launch.name}
      </LinkButton>
    </Card.Body>
  </Card>;
}

function CreateLaunchModal(props) {
  const { currentUser, launches } = useContext(AppContext);
  const [copyId, setCopyId] = useState('');
  const history = useHistory();

  if (!currentUser) return <Loading wat='User' />;
  if (!launches) return <Loading wat='Launches' />;

  const createLaunch = async (e) => {
    const { target } = e;
    const launchId = nanoid();

    // Hide modal so button can't get clicked twice by mistake
    target.disabled = true;

    // Create launch object
    const newLaunch : Partial<iLaunch> = {
      id: launchId,
      name: 'New Launch'
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
      const newPads = {};
      for (const pad of Object.values(pads)) {
        pad.id = nanoid();
        pad.launchId = launchId;
        newPads[pad.id] = pad;
      }
      await busy(target, db.pads.set(launchId, newPads));
    }

    history.push(`/launches/${launchId}/edit`);
  };

  return <Modal {...props}>
    <Modal.Header closeButton>
      <Modal.Title>Copy Another Launch?</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>
        Select a launch below to copy the host, location, and pad configuration to your new launch.
      </p>

      <p className='small text-secondary'>Don't wory, you can edit all this stuff later if you want.</p>

      <FormSelect className='mt-3' value={copyId} onChange={e => setCopyId((e as any).target.value)}>
        <option>(Optional) Launch to copy...</option>
        {
          sortArray(Object.values(launches), 'name')
            .map(launch => <option key={launch.id} value={launch.id}>{launch.name}</option>)
        }
      </FormSelect>
    </Modal.Body>

    <Modal.Footer>
      <Button variant='secondary' onClick={props.onHide}>Cancel</Button>
      <Button onClick={createLaunch} >Create Launch</Button>
    </Modal.Footer>
  </Modal>;
}

export default function Launches() {
  const { launches, currentUser } = useContext(AppContext);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  if (!currentUser) return <Loading wat='User (Launches)' />;
  if (!launches) return <Loading wat='Launches' />;

  return <>
    {
      showLaunchModal ? <CreateLaunchModal show={true} onHide={() => setShowLaunchModal(false)} /> : null
    }

    <div className='d-flex mb-3'>
      <h2 className='flex-grow-1 my-0'>Current and Upcoming Launches</h2>
      <Button className='flex-grow-0' onClick={() => setShowLaunchModal(true)}>New Launch ...</Button>
    </div>
    <div className='deck'>
      {
      Object.values(launches)
        .filter(l => !l.startDate || Date.parse(`${l.endDate}T23:59:59`) >= Date.now())
        .map(l => <EventCard key={l.id} launch={l} />)
      }
    </div>

    <h2>Past Launches</h2>
    <div className='deck'>
      {
        Object.values(launches)
          .filter(l => Date.parse(`${l.endDate}T23:59:59`) < Date.now())
          .map(l => <EventCard key={l.id} launch={l} />)
      }
    </div>
  </>;
}
