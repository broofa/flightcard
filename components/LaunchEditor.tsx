import { nanoid } from 'nanoid';
import React, { useContext, useRef, useState } from 'react';
import { Button, Modal, ModalProps } from 'react-bootstrap';
import { useHistory } from 'react-router';
import simplur from 'simplur';
import { db, DELETE } from '../firebase';
import { iPad } from '../types';
import { sortArray } from '../util/sortArray';
import { AppContext } from './App';
import FloatingInput from './common/FloatingInput';
import { busy, Loading } from './common/util';

function PadEditor({ pad, groups, ...props }
  : {pad : iPad, groups ?: string[]} & ModalProps) {
  const nameRef = useRef<HTMLInputElement>();
  const groupRef = useRef<HTMLInputElement>();

  const { launchId } = pad;
  const { onHide } = props as any;

  const handleSave = function(e) {
    const { target } = e;

    target.classList.toggle('busy', true);

    const name = nameRef.current?.value;
    const group = groupRef.current?.value || DELETE;
    const id = nanoid();

    const action = pad.id
      ? db.pad.update(launchId, pad.id, { name, group })
      : db.pad.set(launchId, id, { id, launchId, name, group });

    busy(e, action).then(onHide);
  };

  const handleDelete = function(e) {
    if (!confirm(`Permanently delete the "${pad.name ?? '(unnamed pad)'}" pad?  This can not be undone, and may affect users with cards assigned to this pad.`)) return;
    const action = db.pad.remove(launchId, pad.id);

    busy(e, action).then(onHide);
  };

  return <Modal show={true} {...props}>
    <Modal.Title className='p-2'>{pad.id ? 'Edit Pad' : 'New Pad'}</Modal.Title>

    <Modal.Body className='d-flex gap-4'>
      <FloatingInput ref={nameRef} className='flex-grow-1' defaultValue={pad.name} >
        <label>Pad Name</label>
      </FloatingInput>

      <FloatingInput ref={groupRef} list='group-names' className='flex-grow-1' defaultValue={pad.group ?? ''} >
        <label>Pad Group <span className='text-info'>(optional)</span></label>
      </FloatingInput>

      <datalist id='group-names'>
      {
        groups?.filter(v => v).map(group => <option key={group} value={group} />)
      }
      </datalist>

    </Modal.Body>

    <Modal.Footer className='d-flex'>
      {pad.id ? <Button onClick={handleDelete} tabIndex={-1} variant='danger'>{'\u2715'} Delete</Button> : null}
      <div className='flex-grow-1' />
      <Button className='ms-5' variant='secondary' onClick={(props as any).onHide}>Cancel</Button>
      <Button onClick={handleSave}>{pad.id ? 'Update' : 'Create'}</Button>
    </Modal.Footer>
  </Modal>;
}

export default function LaunchEditor() {
  const { launch, pads, attendees, cards } = useContext(AppContext);
  const [editPad, setEditPad] = useState<iPad>();
  const history = useHistory();

  if (!launch) return <Loading wat='Launch' />;

  const padGroups = pads
    ? Array.from(new Set(Object.values(pads).map(pad => pad.group ?? '')))
      .sort()
    : [];

  const launchInputProps = function(field) {
    return {
      className: 'flex-grow-1',
      style: {
        minWidth: '20em'
      },

      defaultValue: launch[field] ?? '',

      onBlur(e) {
        const { target } = e;
        let { value } = target;

        if (value == null || value === '') value = undefined;
        if (value == launch[field]) return;

        busy(
          target,
          db.launch.update(launch.id, { [field]: value ?? DELETE })
        );
      }
    };
  };

  const deleteLaunch = async e => {
    const { target } = e;

    const nAttendees = attendees ? Object.keys(attendees).length : 0;
    const nCards = cards ? Object.keys(cards).length : 0;

    if (prompt(simplur`This will permanently DELETE this launch and all activity associated with it, including ${nAttendees} attendee[|s] and ${nCards} flightcard[|s].\n\nYou will not be able to undo this!\n\nTo proceed type the name of the launch here ("${launch.name}") and click OK.`) != launch.name) return;

    await busy(
      target,
      db.launch.remove(launch.id)
        .then(() => Promise.all([
          db.officers.remove(launch.id),
          db.pads.remove(launch.id),
          db.attendees.remove(launch.id),
          db.cards.remove(launch.id)
        ]))
    );

    history.push('/');
  };

  return <>
    {editPad ? <PadEditor onHide={() => setEditPad(undefined)} pad={editPad} groups={padGroups} /> : null}

    <h1>Edit Launch</h1>

    <div className='d-flex flex-wrap gap-3'>
      <FloatingInput {...launchInputProps('name')} >
        <label>Name</label>
      </FloatingInput>

      <FloatingInput {...launchInputProps('host')} >
        <label>Host</label>
      </FloatingInput>

      <FloatingInput {...launchInputProps('location')} >
        <label>Location</label>
      </FloatingInput>

      <div className='d-flex gap-3 flex-grow-1'>
        <FloatingInput type='date' {...launchInputProps('startDate')} >
          <label>Start Date</label>
        </FloatingInput>
        <FloatingInput type='date' {...launchInputProps('endDate')} >
          <label>End Date</label>
        </FloatingInput>
      </div>
    </div>

    <div className='d-flex align-items-baseline mt-4 pt-2 border-top'>
        <h2 className='flex-grow-1 m-0 p-0' >Pads</h2>
        <Button onClick={() => setEditPad({ id: undefined as unknown as string, launchId: launch.id })}>New Pad...</Button>
    </div>

    {
      padGroups
        .map(group => <div key={group}>
          {group ? <h3>{group}</h3> : null}
          <div className='d-flex flex-wrap gap-3'>
          {
            pads
              ? sortArray(Object.values(pads).filter(pad => (pad.group ?? '') === group), 'name')
                .map(pad => <Button variant='outline-primary' key={pad.id} className='' onClick={() => setEditPad(pad)}>
                {pad.name ?? '(unnamed pad)'}
             </Button>)
              : null
          }
          </div>
        </div>)
    }
    <div className='mt-4 d-flex gap-3'>
      <Button variant='danger' onClick={deleteLaunch} tabIndex={-1}>Delete This Launch</Button>
      <div className='flex-grow-1' />
      <Button variant='secondary' onClick={() => history.goBack()}>Back</Button>
      <Button onClick={() => history.push(`/launches/${launch.id}`)}>Check In</Button>
    </div>
  </>;
}
