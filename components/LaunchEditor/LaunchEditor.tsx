import React, { FocusEventHandler, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import simplur from 'simplur';
import { arraySort } from '../../util/arrayUtils';
import { FCLinkButton } from '../common/FCLinkButton';
import { flash } from '../common/Flash';
import { useLaunch } from '../contexts/LaunchContext';
import { useAttendees, useCards, usePads } from '../contexts/rthooks';
import { PadEditor } from '../LaunchEditor/PadEditor';
import { PadGroupEditor } from './PadGroupEditor';
import FloatingInput from '/components/common/FloatingInput';
import { Loading } from '/components/common/util';
import { DELETE, rtRemove, rtUpdate } from '/rt';
import {
  ATTENDEES_PATH,
  CARDS_PATH,
  LAUNCH_PATH,
  OFFICERS_PATH,
  PADS_PATH,
} from '/rt/rtconstants';
import { iLaunch, iPad } from '/types';

export default function LaunchEditor() {
  const [launch] = useLaunch();
  const [pads] = usePads();
  const [cards] = useCards();

  const [attendees] = useAttendees();

  const [editPad, setEditPad] = useState<iPad>();
  const navigate = useNavigate();

  if (!launch) return <Loading wat='Launch' />;

  const padGroups = pads
    ? Array.from(
        new Set(Object.values(pads).map(pad => pad.group ?? ''))
      ).sort()
    : [];

  function launchInputProps(field: keyof iLaunch): {
    className: string;
    defaultValue: string;
    onBlur: FocusEventHandler;
  } {
    return {
      className: 'flex-grow-1',

      defaultValue: String(launch?.[field] ?? ''),

      onBlur(e) {
        if (!launch?.id) throw Error('Launch has no id');

        const target = e.target as HTMLInputElement;
        let value: string | undefined = target.value;

        if (value == null || value === '') value = DELETE;
        if (value == launch?.[field]) return;

        rtUpdate(LAUNCH_PATH.with({ launchId: launch.id }), { [field]: value });
      },
    };
  }

  async function deleteLaunch() {
    const nAttendees = attendees ? Object.keys(attendees).length : 0;
    const nCards = cards ? Object.keys(cards).length : 0;

    if (!launch) return;

    // Verify delete request
    const response = prompt(
      simplur`This will permanently DELETE this launch and all activity associated with it, including ${nAttendees} attendee[|s] and ${nCards} flightcard[|s].\n\nYou will not be able to undo this!\n\nTo proceed type the name of the launch here ("${launch.name}") and click OK.`
    );
    if (response != launch.name) return;

    const rtFields = { launchId: launch.id };

    // TODO: This should really be done using rtTransaction, but it appears that
    // requires giving the current user write permissions at the very top level
    // of the RTDB, which we're not going to do.  So, instead, we delete the
    // collections individually and just pray they don't fail.

    // Delete launch first (required by RTDB rules before deleting other
    // collections)
    await rtRemove(LAUNCH_PATH.with(rtFields));

    // Everything else can be removed in parallel
    await Promise.all([
      rtRemove(OFFICERS_PATH.with(rtFields)),
      rtRemove(CARDS_PATH.with(rtFields)),
      rtRemove(PADS_PATH.with(rtFields)),
      rtRemove(ATTENDEES_PATH.with(rtFields)),
    ]);

    flash('Launch deleted');

    navigate('/launches');
  }

  return (
    <>
      <h1>Edit Launch</h1>

      <div className='d-flex flex-wrap gap-3'>
        <FloatingInput {...launchInputProps('name')}>
          <label>Name</label>
        </FloatingInput>

        <FloatingInput {...launchInputProps('host')}>
          <label>Host</label>
        </FloatingInput>

        <FloatingInput {...launchInputProps('location')}>
          <label>Location</label>
        </FloatingInput>
      </div>

      <div className='d-flex flex-wrap gap-3 mt-3'>
        <FloatingInput type='date' {...launchInputProps('startDate')}>
          <label>Start Date</label>
        </FloatingInput>
        <FloatingInput type='date' {...launchInputProps('endDate')}>
          <label>End Date</label>
        </FloatingInput>
      </div>

      <div className='d-flex align-items-baseline mt-4 pt-2 border-top'>
        <h2 className='flex-grow-1 m-0 p-0'>Pads</h2>
        <Button
          onClick={() =>
            setEditPad({
              id: undefined as unknown as string,
              launchId: launch.id,
            } as iPad)
          }
        >
          New Pad...
        </Button>
      </div>

      {padGroups.map(group => (
        <div key={group}>
          <PadGroupEditor launchId={launch.id} padGroup={group} />
          <div className='d-flex flex-wrap gap-3 mb-4'>
            {pads
              ? arraySort(
                  Object.values(pads).filter(
                    pad => (pad.group ?? '') === group
                  ),
                  'name'
                ).map(pad => (
                  <Button
                    variant='outline-primary'
                    key={pad.id}
                    style={{ minWidth: '5em', maxWidth: 'max-content' }}
                    onClick={() => setEditPad(pad)}
                  >
                    {pad.name ?? '(unnamed pad)'}
                  </Button>
                ))
              : null}
          </div>
        </div>
      ))}
      <div className='d-flex justify-content-between mt-5 gap-3'>
        <Button variant='danger' onClick={deleteLaunch} tabIndex={-1}>
          Delete This Launch
        </Button>
        <FCLinkButton variant='secondary' to={-1}>
          Close
        </FCLinkButton>
      </div>

      {editPad ? (
        <PadEditor
          onHide={() => setEditPad(undefined)}
          pad={editPad}
          groups={padGroups}
        />
      ) : null}
    </>
  );
}
