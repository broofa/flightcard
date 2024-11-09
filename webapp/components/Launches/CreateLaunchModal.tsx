import React, { MouseEventHandler, useState } from 'react';
import { Button, FormSelect, Modal, ModalProps } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { iAttendee, iLaunch, iPad, iPads } from '../../types';
import { APPNAME } from '../App/App';
import { useCurrentUser, useLaunches } from '../contexts/rt_hooks';
import { Loading, randomId } from '/components/common/util';
import { DELETE, rtGet, rtTransaction } from '/rt';
import {
  ATTENDEE_PATH,
  LAUNCH_PATH,
  OFFICER_PATH,
  PADS_PATH,
} from '/rt/rtconstants';
import { arraySort } from '/util/array-util';

export function CreateLaunchModal(props: ModalProps & { onHide: () => void }) {
  const [launches, launchesLoading] = useLaunches();
  const [currentUser] = useCurrentUser();
  const [copyId, setCopyId] = useState('');
  const navigate = useNavigate();

  if (!currentUser) return <Loading wat='User' />;
  if (launchesLoading) return <Loading wat='Launches' />;

  const createLaunch: MouseEventHandler = async (e) => {
    const target = e.target as HTMLButtonElement;
    const launchId = randomId();

    // Hide modal so button can't get clicked twice by mistake
    target.disabled = true;

    // Create launch object
    const newLaunch: Partial<iLaunch> = {
      id: launchId,
      name: 'New Launch',
    };

    // Copy properties if needed
    const srcLaunch = launches?.[copyId];
    if (srcLaunch) {
      newLaunch.host = srcLaunch.host;
      newLaunch.location = srcLaunch.location;
    }

    const transaction = rtTransaction();

    // Save launch
    transaction.update<iLaunch>(
      LAUNCH_PATH.with({ launchId: newLaunch.id ?? '' }),
      newLaunch as iLaunch
    );

    // Make current user the first officer
    transaction.update<boolean>(
      OFFICER_PATH.with({
        launchId: newLaunch.id ?? '',
        userId: currentUser.id,
      }),
      true
    );

    // Add current user as attendee
    transaction.update<iAttendee>(
      ATTENDEE_PATH.with({
        launchId: newLaunch.id ?? '',
        userId: currentUser.id,
      }),
      {
        id: currentUser.id,
        name: currentUser.name ?? DELETE,
        photoURL: currentUser.photoURL ?? DELETE,
        waiverTime: Date.now(),
      }
    );

    // Copy launch pads
    if (srcLaunch) {
      const pads = await rtGet<iPads>(
        PADS_PATH.with({ launchId: srcLaunch.id })
      );
      const newPads: { [padId: string]: iPad } = {};
      for (const pad of Object.values(pads)) {
        pad.id = randomId();
        newPads[pad.id] = pad;
      }
      transaction.update<iPads>(PADS_PATH.with({ launchId }), newPads);
    }

    await transaction.commit();

    // Go to new launch page
    navigate(`/launches/${launchId}/edit`);
  };

  return (
    <Modal {...props}>
      <Modal.Header closeButton>
        <Modal.Title>New Launch</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Has your club used {APPNAME} previously? If so, you can select one of
          your previous launches below to copy the host, location, and pad
          configuration to your new launch.
        </p>

        <p className='text-tip'>
          ... or just click "Create Launch" to start with a fresh, new launch!
          :-)
        </p>

        <FormSelect
          className='mt-3'
          value={copyId}
          onChange={(e) => setCopyId(e.target.value)}
        >
          <option>(Optional) Launch to copy...</option>
          {arraySort(Object.values(launches ?? []), 'name').map((launch) => (
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
