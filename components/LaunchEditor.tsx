import { nanoid } from 'nanoid';
import React, { useContext, useRef, useState } from 'react';
import { Button, Modal, ModalProps } from 'react-bootstrap';
import { useHistory } from 'react-router';
import { db, DELETE } from '../firebase';
import { iPad } from '../types';
import { sortArray } from '../util/sortArray';
import { AppContext } from './App';
import FloatingInput from './common/FloatingInput';
import { busy, Loading, tProps } from './common/util';

function PadEditor({ pad, groups, ...props }
  : {pad : iPad, groups ?: string[]} & ModalProps & tProps) {
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
  const { launch, pads } = useContext(AppContext);
  const [editPad, setEditPad] = useState<iPad>();
  const history = useHistory();

  if (!launch) return <Loading wat='Launch' />;

  const padGroups = pads
    ? Array.from(new Set(Object.values(pads).map(pad => pad.group ?? '')))
      .sort()
    : [];

  const launchInputProps = function(field) {
    return {
      className: 'mt-3',

      defaultValue: launch[field] ?? '',

      onBlur(e) {
        const { target } = e;
        if (target.value == launch[field]) return;
        // TODO: Save indicator
        e.target.classList.toggle('busy', true);
        db.launch.update(launch.id, { [field]: target.value })
          .finally(() => target.classList.toggle('busy', false));
      }
    };
  };

  const deleteLaunch = async e => {
    if (prompt(`This will permanently DELETE this launch and all activity associated with it, including all waivers and flightcards.\n\nTHIS IS PROBABLY A BAD IDEA!\n\nTo proceed type "${launch.name}" here and click OK.`) != launch.name) return;

    await busy(
      e.target,
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

    <FloatingInput {...launchInputProps('name')} >
      <label>Name</label>
    </FloatingInput>

    <FloatingInput {...launchInputProps('host')} >
      <label>Host</label>
    </FloatingInput>

    <FloatingInput {...launchInputProps('location')} >
      <label>Location</label>
    </FloatingInput>

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
    <h2 className='text-danger mt-4 pt-3 border-top border-danger'>Danger Zone</h2>
    <Button variant='danger' onClick={deleteLaunch}>Delete This Launch</Button>
  </>;
}
