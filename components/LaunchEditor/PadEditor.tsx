import React, { MouseEventHandler, useRef } from 'react';
import { Button, Modal, ModalProps } from 'react-bootstrap';
import { useLaunch } from '../contexts/rt_hooks';
import FloatingInput from '/components/common/FloatingInput';
import { busy, Loading, randomId } from '/components/common/util';
import { DELETE, rtRemove, rtSet, rtUpdate } from '/rt';
import { PAD_PATH } from '/rt/rtconstants';
import { iPad } from '/types';

export function PadEditor({
  pad,
  groups,
  ...props
}: { pad: iPad; groups?: string[] } & ModalProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLInputElement>(null);
  const [launch] = useLaunch();

  if (!launch) {
    return <Loading wat='Launch' />;
  }

  const { id: launchId } = launch;

  const { onHide } = props;

  const handleSave: MouseEventHandler = function (e) {
    const target = e.target as HTMLButtonElement;

    target.classList.toggle('busy', true);

    const name = nameRef.current?.value ?? '';
    const group = groupRef.current?.value || DELETE;

    let action;
    if (pad.id) {
      action = rtUpdate<iPad>(PAD_PATH.with({ launchId, padId: pad.id }), {
        name: name.trim(),
        group,
      });
    } else {
      const names = name.split(',').filter((v) => v);
      action = Promise.all(
        names.map((padName) => {
          const id = randomId();
          return rtSet<iPad>(PAD_PATH.with({ launchId, padId: id }), {
            id,
            name: padName.trim(),
            group,
          });
        })
      );
    }

    busy(e.target as HTMLElement, action).then(onHide);
  };

  const handleDelete: MouseEventHandler = function (e) {
    if (
      !confirm(
        `Permanently delete the "${
          pad.name ?? '(unnamed pad)'
        }" pad?  This can not be undone, and may affect users with cards assigned to this pad.`
      )
    )
      return;
    const action = rtRemove(PAD_PATH.with({ launchId, padId: pad.id }));

    busy(e.target as HTMLElement, action).then(onHide);
  };

  return (
    <Modal show={true} {...props}>
      <Modal.Title className='p-2'>
        {pad.id ? 'Edit Pad' : 'New Pad'}
      </Modal.Title>

      <Modal.Body>
        <div className='d-flex gap-4'>
          <FloatingInput
            autoFocus
            ref={nameRef}
            className='flex-grow-1'
            defaultValue={pad.name}
          >
            <label>Pad Name</label>
          </FloatingInput>

          <FloatingInput
            ref={groupRef}
            list='group-names'
            className='flex-grow-1'
            defaultValue={pad.group ?? ''}
          >
            <label>
              Pad Group <span className='text-info'>(optional)</span>
            </label>
          </FloatingInput>

          <datalist id='group-names'>
            {groups
              ?.filter((v) => v)
              .map((group) => (
                <option key={group} value={group} />
              ))}
          </datalist>
        </div>
        {pad.id ? null : (
          <small className='text-secondary text-center mt-3 font-small display-block'>
            To create multiple pads at once, separate names with a comma (",")
          </small>
        )}
      </Modal.Body>

      <Modal.Footer className='d-flex'>
        {pad.id ? (
          <Button onClick={handleDelete} tabIndex={-1} variant='danger'>
            {'\u2715'} Delete
          </Button>
        ) : null}
        <div className='flex-grow-1' />
        <Button
          className='ms-5'
          variant='secondary'
          onClick={(props as any).onHide}
        >
          Cancel
        </Button>
        <Button onClick={handleSave}>{pad.id ? 'Update' : 'Create'}</Button>
      </Modal.Footer>
    </Modal>
  );
}
