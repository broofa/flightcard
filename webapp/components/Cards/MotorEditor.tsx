import { type ChangeEvent, type HTMLAttributes, useRef, useState } from 'react';
import { Badge, Button, Form, FormSelect, Modal } from 'react-bootstrap';
import type { TCMotor } from 'thrustcurve-db';
import { motorDisplayName } from '../../util/MotorDB';
import { busy, randomId, sig } from '../common/util';
import { useUserUnits } from '../contexts/rt_hooks';
import './MotorEditor.scss';
import { DELETE, rtRemove, rtSet } from '/rt';
import { CARD_MOTOR_PATH, type CardFields } from '/rt/rtconstants';
import type { iMotor } from '/types';
import { useMotorDB } from '/util/MotorDB-hook';
import { MKS, unitConvert, unitParse } from '/util/units';

const MAX_SUGGESTIONS = 12;

export function MotorEditor({
  motor,
  rtFields,
  onHide,
}: {
  motor: iMotor;
  rtFields: CardFields;
  onHide: () => void;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const motorDB = useMotorDB();
  const [delayListId] = useState(randomId()); // 'Just need a unique ID of some sort here
  const [userUnits = MKS] = useUserUnits();
  const [suggestions, setSuggestions] = useState<TCMotor[]>([]);
  const saveButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState(motor.name);
  const [stage, setStage] = useState(String(motor?.stage ?? '1'));
  const [delay, setDelay] = useState(String(motor?.delay ?? ''));

  const tcMotor = motorDB?.getMotorByDisplayName(name);

  const [impulse, setImpulse] = useState('');

  function onNameChange(e: ChangeEvent<HTMLInputElement>) {
    if (!motorDB) return;
    const newName = e.target.value;
    setSuggestions(motorDB.motorSearch(newName));
    setName(newName);
  }

  function onDelayChange(e: ChangeEvent<HTMLInputElement>) {
    setDelay(e.target.value);
  }

  function onStageChange(e: ChangeEvent<HTMLSelectElement>) {
    setStage(e.target.value);
  }

  function onImpulseChange(e: ChangeEvent<HTMLInputElement>) {
    setImpulse(e.target.value);
  }

  function onSave() {
    const _stage = Number.parseInt(stage ?? '');
    const _delay = Number.parseInt(delay ?? '');
    const _impulse =
      tcMotor?.totImpulseNs ?? unitParse(impulse, userUnits.impulse);

    const _newMotor: iMotor = {
      ...motor,
      id: motor.id || randomId(),
      name,
      tcMotorId: tcMotor?.motorId ?? DELETE,
      stage: Number.isNaN(_stage) ? DELETE : _stage,
      delay: Number.isNaN(_delay) ? DELETE : _delay,
      impulse: Number.isNaN(_impulse) ? DELETE : _impulse,
    };

    busy(
      saveButton.current,
      rtSet(
        CARD_MOTOR_PATH.with({ ...rtFields, motorId: _newMotor.id }),
        _newMotor
      )
    ).then(onHide);
  }

  function onDelete() {
    busy(
      deleteButton.current,
      rtRemove(CARD_MOTOR_PATH.with({ ...rtFields, motorId: motor.id }))
    ).then(onHide);
  }

  const displayImpulse = tcMotor
    ? sig(unitConvert(tcMotor?.totImpulseNs, MKS.impulse, userUnits.impulse), 3)
    : impulse;

  return (
    <Modal size='lg' show={true} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{!motor.id ? 'Add Motor' : 'Edit Motor'}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <datalist id={delayListId}>
          {tcMotor?.delays?.split(',')?.map((d) => (
            <option key={String(d)} value={String(d)} />
          ))}
        </datalist>

        <Form.Control
          autoFocus
          className='flex-grow-1'
          onChange={onNameChange}
          value={name}
          placeholder='Motor name'
        />

        {suggestions.length ? (
          <>
            <div className='motor-suggestions'>
              {suggestions.slice(0, MAX_SUGGESTIONS).map((motor) => (
                <Badge
                  bg='secondary'
                  className='suggestion'
                  key={motor.motorId}
                  onClick={() => {
                    setName(motorDisplayName(motor));
                    setSuggestions([]);
                  }}
                >
                  {motorDisplayName(motor)}
                </Badge>
              ))}
            </div>
            {suggestions.length > MAX_SUGGESTIONS ? (
              <span style={{ fontSize: '0.8em' }}>
                ({suggestions.length - MAX_SUGGESTIONS} more not shown)
              </span>
            ) : null}
          </>
        ) : null}

        <div
          className='d-grid mt-3'
          style={{ gap: '.5em 1em', gridTemplateColumns: 'max-content 1fr' }}
        >
          <label className='mx-2'>
            Impulse<sub> total</sub>
            <span className='text-info ms-2'>({userUnits.impulse})</span>
          </label>
          <Form.Control
            className='ms-sm-2'
            disabled={!!tcMotor}
            value={displayImpulse}
            onChange={onImpulseChange}
          />

          <label className='mx-2'>
            Delay
            <span className='text-info ms-2'>(secs)</span>
          </label>
          <Form.Control
            className='flex-grow-1 ms-sm-2'
            list={delayListId}
            value={delay}
            onChange={onDelayChange}
          />

          <label className='mx-2'>Stage</label>
          <FormSelect
            className='flex-grow-1 ms-sm-2'
            value={stage}
            onChange={onStageChange}
          >
            <option value='1'>1</option>
            <option value='2'>2</option>
            <option value='3'>3</option>
            <option value='4'>4</option>
          </FormSelect>
        </div>
      </Modal.Body>
      <Modal.Footer className='d-flex'>
        {motor.id ? (
          <Button
            ref={deleteButton}
            onClick={onDelete}
            tabIndex={-1}
            variant='danger'
          >
            {'\u2715'} Delete
          </Button>
        ) : null}
        <div className='flex-grow-1' />

        <Button variant='secondary' onClick={onHide}>
          Cancel
        </Button>
        <Button ref={saveButton} style={{ minWidth: '6em' }} onClick={onSave}>
          {motor.id ? 'Update' : 'Add'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
