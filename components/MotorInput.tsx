import { nanoid } from 'nanoid';
import React, { HTMLAttributes, useContext, useState } from 'react';
import { Button, Form, FormSelect, Image, Modal, ModalProps } from 'react-bootstrap';
import MOTORS, { Motor, parseDelays } from 'thrustcurve-db';
// @ts-ignore: parcel module resolution handles this
import tcLogo from '../art/thrustcurve.png';
import { DELETE } from '../firebase';
import { iMotor } from '../types';
import { getMotorByDisplayName, motorDisplayName } from '../util/motor-util';
import { sortArray } from '../util/sortArray';
import { MKS, tUnitSystem, unitConvert, unitParse } from '../util/units';
import { AppContext } from './App';
import { sig } from './common/util';

type tMotorFields = {
  name : string;
  delay : string;
  impulse : string;
  stage : string;
};

export function MotorDataList(props) {
  function sortKey(motor) {
    const { manufacturerAbbrev, commonName, discontinued } = motor;

    return (discontinued ? '1' : '0') +
    '-' + manufacturerAbbrev +
    '-' + commonName;
  }

  const motors = sortArray(MOTORS, sortKey);

  return <datalist {...props}>
    {
      motors.map(m => <option key={m.motorId} value={motorDisplayName(m)} />)
    }
  </datalist>;
}

function MotorItem({ motor, onChange, onDetail } : {
  motor : iMotor,
  onChange : (motor : iMotor | undefined) => void,
  onDetail : (motor : Motor | undefined) => void,
  className ?: string,
} & HTMLAttributes<HTMLDivElement>) {
  const key = (motor as any)?._key;
  const [delayListId] = useState(nanoid());
  const tcMotor = getMotorByDisplayName(motor?.name);
  const { userUnits } = useContext(AppContext);

  const [fields, setFields] = useState<tMotorFields>({
    name: motor?.name ?? '',
    stage: String(motor?.stage ?? '1'),
    delay: String(motor?.delay ?? ''),
    impulse: motor?.impulse
      ? String(unitConvert(motor.impulse, MKS.impulse, userUnits.impulse))
      : ''
  });

  const delays = tcMotor?.delays ? parseDelays(tcMotor.delays) : null;

  function patchFields(patch : Partial<tMotorFields>, isChange = false) {
    const newFields : tMotorFields = { ...fields, ...patch };
    setFields(newFields);

    if (isChange) {
      // Create new Motor
      const newMotor : iMotor = {
        name: newFields.name,
        impulse: DELETE,
        delay: DELETE,
        stage: DELETE,
        tcMotorId: DELETE
      };

      // Carry hidden "_key" forward
      if (key) Object.defineProperty(newMotor, '_key', { value: key });

      const _tcMotor = getMotorByDisplayName(newMotor.name);
      if (_tcMotor) newMotor.tcMotorId = _tcMotor.motorId;

      if (newFields.delay) newMotor.delay = Number(newFields.delay);
      if (newFields.stage != '1') newMotor.stage = Number(newFields.stage);
      if (newFields.impulse) {
        try {
          newMotor.impulse = unitParse(newFields.impulse, userUnits.impulse, MKS.impulse);
        } catch (err) {
          console.error(err);
        }
      }

      onChange(newMotor);
    }
  }

  function onNameChange({ target }) {
    const name = target.value;
    const patch : Partial<tMotorFields> = { name };

    const _tcMotor = getMotorByDisplayName(name);
    if (_tcMotor) {
      patch.impulse = String(sig(unitConvert(_tcMotor.totImpulseNs, MKS.impulse, userUnits.impulse)));
    }
    patchFields(patch, true);
  }

  function onImpulseChange({ type, target }) {
    const val : string = target.value;

    // Is value parsable
    let parsed : number | undefined;
    try {
      target.setCustomValidity('');
      parsed = unitParse(val, userUnits.impulse);
    } catch (err) {
      target.setCustomValidity(err.message);
    }

    if (type == 'blur' && parsed) {
      patchFields({ impulse: String(sig(parsed)) }, true);
    } else {
      patchFields({ impulse: val }, true);
    }

    target.reportValidity();
  }

  return <>
    <div className='d-flex'>
      <Form.Control
        onChange={onNameChange}
        list='tc-motors'
        value={fields?.name ?? ''}
        placeholder='e.g. D12'
        style={{ borderRight: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />

      <Button
        onClick={() => onDetail?.(tcMotor)}
        className='p-0 rounded-end border-start-0'
        disabled={!tcMotor}
        style={{ borderLeft: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
        <Image src={tcLogo} style={tcMotor ? {} : { filter: 'grayscale(1)' } } />
      </Button>
    </div>

    <datalist id={delayListId}>
      {delays?.times?.map(d => <option key={String(d)} value={String(d)} />)}
    </datalist>

    {
      fields?.name
        ? <Form.Control
          className='flex-grow-1'
          value={fields.impulse ?? ''}
          disabled={!!tcMotor}
          onChange={onImpulseChange}
          onBlur={onImpulseChange} />
        : <div />
    }

    {
      fields?.name
        ? <Form.Control
          className='flex-grow-1'
          list={delayListId}
          value={fields.delay ?? ''}
          onChange={e => patchFields({ delay: e.target.value }, true)} />
        : <div />
    }

    {
    fields?.name
      ? <FormSelect
        value={fields.stage ?? ''}
        onChange={e => patchFields({ stage: (e.target as any).value }, true)} >
        <option value='1'>1</option>
        <option value='2'>2</option>
        <option value='3'>3</option>
        <option value='4'>4</option>
      </FormSelect>
      : <div></div>
    }
    {
      !(motor as any)._blank
        ? <Button className='ms-3' tabIndex={-1} variant='danger' onClick={() => onChange(undefined)}>{'\u2715'}</Button>
        : <span /> // <Button className='ms-3' tabIndex={-1} variant='primary'>{'\uFF0B'}</Button>
    }
  </>;
}

// Playing around with a component that knows about unit types
function MKSValue({ value, type, long } :
  {
    value : number,
    long : boolean,
    type : keyof tUnitSystem
  } & HTMLAttributes<HTMLSpanElement>) {
  const { userUnits } = useContext(AppContext);
  const fromUnit = MKS[type];
  const toUnit = userUnits[type];

  return <>{sig(unitConvert(value, fromUnit, toUnit))}{long ? ' ' + userUnits[type] : null}</>;
}

function MotorModal({ motor, ...props } : {motor : Motor} & ModalProps) {
  let graph;
  const { samples } = motor;
  if (samples) {
    const W = 400;
    const H = 100;
    const tMax = samples[samples.length - 1][0];
    const vMax = samples.map(([, v]) => v).reduce((a, b) => Math.max(a, b), 0);
    const yAvg = H * (1 - 0.9 * motor.avgThrustN / vMax);

    const points = samples.map(([t, v]) => `${sig(W * (t / tMax))},${sig(H * (1 - 0.9 * v / vMax))}`);
    console.log(points.join(' '));
    graph = <svg
      className='border border-secondary rounded'
      width='100%'
      viewBox={`0 0 ${W} ${H}`}
      strokeWidth='2'
      height='10%'
      preserveAspectRatio='none'>
      <polyline stroke='black' strokeWidth='1' fill='lightgrey' points={points.join(' ')}/>
      <line
        x1='0' y1={yAvg}
        x2={W} y2={yAvg}
        strokeWidth='2'
        strokeDasharray='10 4'
        stroke='green' />
    </svg>;
  }

  return <Modal show={true} {...props}>
    <Modal.Header closeButton>{motorDisplayName(motor)}</Modal.Header>
    <Modal.Body>
      {graph}
      <div className='d-flex'>
        <div className='text-start small'>0 sec</div>
        <div className='text-end small flex-grow-1'>{motor.burnTimeS} sec</div>
      </div>

      <div className='d-grid' style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>Max thrust</div><div><MKSValue value={motor.maxThrustN} type='force' long/></div>
        <div>Max thrust</div><div><MKSValue value={motor.avgThrustN} type='force' long/></div>
        <div>Propellent</div><div>{motor.propInfo}</div>
      </div>
    </Modal.Body>
  </Modal>;
}

export function MotorList({ motors = [], onChange } :
  {
    motors : iMotor[],
    onChange : (motors : iMotor[]) => void,
  }) {
  const { userUnits } = useContext(AppContext);
  const [motorDetail, setMotorDetail] = useState<Motor>();

  const motorModal = motorDetail
    ? <MotorModal motor={motorDetail} onHide={() => setMotorDetail(undefined)} />
    : null;

  // Blank motor to allow adding new ones
  // (_blank property gets dropped by MotorItem when motor changes)
  const _motors = [...motors];
  if (!_motors.some(m => (m as any)._blank)) {
    const _key = nanoid();
    _motors.push({ _key, _blank: true } as unknown as iMotor);
  }

  return <>
    <div className='d-grid gap-2' style={{ gridTemplateColumns: '1fr 5em 5em 5em auto' }}>
      <div className='text-secondary text-center'>Motor</div>
      <div className='text-secondary text-center'>
        I<sub>t</sub>
        <span className='text-info small ms-1'>({userUnits.impulse})</span>
        </div>
      <div className='text-secondary text-center'>
        Delay
        <span className='text-info small ms-1'>(s)</span>
      </div>
      <div className='text-secondary text-center'>Stage</div>
      <div className='text-secondary text-center'></div>
      {
        _motors.map(m => {
          const key = (m as any)._key;

          // HACK: Make sure each motor has an _key, w/out having it show up downstream
          if (m && !(m as any)._key) {
            Object.defineProperty(m, '_key', { value: nanoid() });
          }

          function handleChange(motor) {
            const newMotors = [..._motors];
            const i = newMotors.findIndex(m => (m as any)._key == key);

            if (i < 0) throw Error(`Huh? Motor ${key} went away :-(`);

            if (!motor?.name) {
              newMotors.splice(i, 1);
            } else {
              const stageChanged = newMotors[i].stage != motor.stage;
              newMotors[i] = motor;
              // Sort motors if order may have changed
              if (stageChanged) sortArray(newMotors, m => (m as any)._blank ? Infinity : (m.stage ?? 1));
            }

            onChange(newMotors.filter(m => !(m as any)._blank));
          }

          return <MotorItem key={(m as any)._key}
            className='mb-3'
            motor={m}
            onDetail={setMotorDetail}
            onChange={handleChange}
             />;
        })
      }
    </div>

    {motorModal}
  </>;
}
