import { nanoid } from 'nanoid';
import React, {
  ChangeEvent,
  HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button, Form, FormSelect, Modal } from 'react-bootstrap';
import { Motor } from 'thrustcurve-db';
import { AppContext } from '../App/App';
import { busy, sig } from '../common/util';
import { CARD_MOTOR_PATH, DELETE, MotorFields, rtpath, util } from '/firebase';
import { iMotor } from '/types';
import { getMotorByDisplayName } from '/util/motor-util';
import { MKS, unitConvert, unitParse } from '/util/units';

export function MotorEditor({
  motor,
  rtFields,
  onHide,
}: {
  motor: iMotor;
  rtFields: MotorFields;
  onHide: () => void;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const [delayListId] = useState(nanoid()); // 'Just need a unique ID of some sort here
  const { userUnits } = useContext(AppContext);
  const saveButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);

  const [name, setName] = useState(motor.name);
  const [stage, setStage] = useState(String(motor?.stage ?? '1'));
  const [delay, setDelay] = useState(String(motor?.delay ?? ''));
  const [impulse, setImpulse] = useState(
    motor?.impulse
      ? String(unitConvert(motor.impulse, MKS.impulse, userUnits.impulse))
      : ''
  );

  const tcMotor = getMotorByDisplayName(name);

  useEffect(() => {
    if (tcMotor == null) {
      setImpulse('');
    } else {
      setImpulse(
        sig(
          unitConvert(tcMotor?.totImpulseNs, MKS.impulse, userUnits.impulse),
          3
        )
      );
    }
  }, [tcMotor, userUnits.impulse]);

  function onNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
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

  function onImpulseBlur() {
    const _impulse = unitParse(impulse, userUnits.impulse);
    if (!isNaN(_impulse)) {
      setImpulse(sig(_impulse, 3));
    }
  }

  function onSave() {
    const _stage = parseInt(stage ?? '');
    const _delay = parseInt(delay ?? '');
    const _impulse = unitConvert(impulse, userUnits.impulse, MKS.impulse);
    const _newMotor: iMotor = {
      ...motor,
      id: motor.id || nanoid(),
      name,
      tcMotorId: tcMotor?.motorId ?? DELETE,
      stage: isNaN(_stage) ? DELETE : _stage,
      delay: isNaN(_delay) ? DELETE : _delay,
      impulse: isNaN(_impulse) ? DELETE : _impulse,
    };

    busy(
      saveButton.current,
      util.set(
        rtpath(CARD_MOTOR_PATH, { ...rtFields, motorId: _newMotor.id }),
        _newMotor
      )
    ).then(onHide);
  }

  function onDelete() {
    busy(
      deleteButton.current,
      util.remove(rtpath(CARD_MOTOR_PATH, { ...rtFields, motorId: motor.id }))
    ).then(onHide);
  }

  function onDetail(motor?: Motor) {}

  return (
    <Modal size='lg' show={true} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{!motor.id ? 'Add Motor' : 'Edit Motor'}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <datalist id={delayListId}>
          {tcMotor?.delays?.split(',')?.map(d => (
            <option key={String(d)} value={String(d)} />
          ))}
        </datalist>

        <Form.Control
          className='flex-grow-1'
          onChange={onNameChange}
          list='tc-motors'
          value={name}
          placeholder='Motor name'
        />

        <div
          className='d-grid mt-3'
          style={{ gap: '.5em 1em', gridTemplateColumns: 'min-content 1fr' }}
        >
          <label className='mx-2'>
            I<sub>t</sub>:
          </label>
          <Form.Control
            className='ms-sm-2'
            disabled={!!tcMotor}
            value={impulse ?? ''}
            onChange={onImpulseChange}
            onBlur={onImpulseBlur}
          />

          <label className='mx-2'>Delay:</label>
          <Form.Control
            className='flex-grow-1 ms-sm-2'
            list={delayListId}
            value={delay}
            onChange={onDelayChange}
          />

          <label className='mx-2'>Stage:</label>
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
