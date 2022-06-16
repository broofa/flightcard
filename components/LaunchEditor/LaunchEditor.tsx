import React, { useContext, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import simplur from 'simplur';
import { sortArray } from '../../util/sortArray';
import { PadEditor } from './PadEditor';
import { AppContext } from '../App/App';
import FloatingInput from '/components/common/FloatingInput';
import { busy, Loading } from '/components/common/util';
import { db, DELETE } from '/firebase';
import { iPad } from '/types';

export default function LaunchEditor() {
  const { launch, pads, attendees, cards } = useContext(AppContext);
  const [editPad, setEditPad] = useState<iPad>();
  const navigate = useNavigate();

  if (!launch) return <Loading wat='Launch' />;

  const padGroups = pads
    ? Array.from(
        new Set(Object.values(pads).map(pad => pad.group ?? ''))
      ).sort()
    : [];

  const launchInputProps = function (field) {
    return {
      className: 'flex-grow-1',
      // style: {
      //   minWidth: '20em',
      // },

      defaultValue: launch[field] ?? '',

      onBlur(e) {
        const { target } = e;
        let { value } = target;

        if (value == null || value === '') value = undefined;
        if (value == launch[field]) return;

        busy(target, db.launch.update(launch.id, { [field]: value ?? DELETE }));
      },
    };
  };

  const deleteLaunch = async e => {
    const { target } = e;

    const nAttendees = attendees ? Object.keys(attendees).length : 0;
    const nCards = cards ? Object.keys(cards).length : 0;

    if (
      prompt(
        simplur`This will permanently DELETE this launch and all activity associated with it, including ${nAttendees} attendee[|s] and ${nCards} flightcard[|s].\n\nYou will not be able to undo this!\n\nTo proceed type the name of the launch here ("${launch.name}") and click OK.`
      ) != launch.name
    )
      return;

    await busy(
      target,
      db.launch
        .remove(launch.id)
        .then(() =>
          Promise.all([
            db.officers.remove(launch.id),
            db.pads.remove(launch.id),
            db.attendees.remove(launch.id),
            db.cards.remove(launch.id),
          ])
        )
    );

    navigate('/');
  };

  return (
    <>
      {editPad ? (
        <PadEditor
          onHide={() => setEditPad(undefined)}
          pad={editPad}
          groups={padGroups}
        />
      ) : null}

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
            })
          }
        >
          New Pad...
        </Button>
      </div>

      {padGroups.map(group => (
        <div key={group}>
          {group ? <h3>{group}</h3> : null}
          <div className='d-flex flex-wrap gap-3'>
            {pads
              ? sortArray(
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
      <div className='mt-4 d-flex gap-3'>
        <Button variant='danger' onClick={deleteLaunch} tabIndex={-1}>
          Delete This Launch
        </Button>
        <div className='flex-grow-1' />
        <Button variant='secondary' onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    </>
  );
}