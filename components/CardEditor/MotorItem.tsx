import { nanoid } from 'nanoid';
import React, {
  ChangeEvent,
  HTMLAttributes,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Button, Form, FormSelect, Image } from 'react-bootstrap';
import { Motor as TCMotor } from 'thrustcurve-db';
import { getMotorByDisplayName } from '../../util/motor-util';
import { MKS, unitConvert, unitParse } from '../../util/units';
import { AppContext } from '../App/App';
import { sig, usePrevious } from '../common/util';
import { isPlaceholderMotor } from './MotorList';
import tcLogo from '/art/thrustcurve.png';
import { DELETE, util } from '/firebase';
import { iMotor } from '/types';

export function MotorItem({
  motor,
  rtPath,
  onDetail,
}: {
  motor: iMotor;
  rtPath: string;
  onDetail: (motor?: TCMotor) => void;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const [delayListId] = useState(nanoid()); // 'Just need a unique ID of some sort here
  const { userUnits } = useContext(AppContext);

  const [name, setName] = useState(motor.name);
  const [stage, setStage] = useState(String(motor?.stage ?? '1'));
  const [delay, setDelay] = useState(String(motor?.delay ?? ''));
  const [impulse, setImpulse] = useState(
    motor?.impulse
      ? String(unitConvert(motor.impulse, MKS.impulse, userUnits.impulse))
      : ''
  );
  const [newMotor, setNewMotor] = useState(motor);
  const [savedMotor, setSavedMotor] = useState(motor);
  const [saving, setSaving] = useState(false);

  const tcMotor = getMotorByDisplayName(name);
  const previousTCMotor = usePrevious(tcMotor);
  const [isPlaceholder, setIsPlaceholder] = useState(isPlaceholderMotor(motor));

  // Update UI if rt data changes
  // util.useValue<iMotor>(rtPath, motor => {
  //   if (!motor) return;
  //   setName(motor?.name ?? '');
  //   setStage(String(motor?.stage ?? '1'));
  //   setDelay(String(motor?.delay ?? ''));
  //   setImpulse(
  //     motor?.impulse
  //       ? String(
  //           sig(unitConvert(motor.impulse, MKS.impulse, userUnits.impulse))
  //         )
  //       : ''
  //   );
  //   setNewMotor(motor);
  //   setSavedMotor(motor);
  // });

  // Effect for saving motor
  useEffect(() => {
    if (newMotor === savedMotor) return;

    const placeholder = isPlaceholderMotor(newMotor);
    setIsPlaceholder(placeholder);

    let abort = false;
    const timer = setTimeout(() => {
      setSaving(true);
      if (!placeholder) {
        util.set(rtPath, newMotor).then(() => {
          !abort && setSaving(false);
          setSavedMotor(newMotor);
        });
      } else {
        util.remove(rtPath).then(() => !abort && setSaving(false));
      }
    }, 500);

    return () => {
      abort = true;
      clearTimeout(timer);
    };
  }, [rtPath, newMotor, savedMotor]);

  function onNameChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    const tcm = getMotorByDisplayName(val);
    const nm = { ...newMotor, name: val };
    if (tcm !== previousTCMotor) {
      console.log('UPDATING TCM', tcm);
      nm.impulse = tcm?.totImpulseNs ?? DELETE;
      nm.tcMotorId = tcm?.motorId ?? DELETE;
    }
    setNewMotor(nm);
  }

  function onDelayChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setDelay(val);
    const delay = parseInt(val);
    setNewMotor({ ...newMotor, delay: isNaN(delay) ? DELETE : delay });
  }

  function onStageChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setStage(val);
    const stage = parseInt(val);
    setNewMotor({ ...newMotor, stage: isNaN(stage) ? DELETE : stage });
  }

  function onImpulseChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setImpulse(val);
    const impulse = unitParse(val, userUnits.impulse);
    setNewMotor({ ...newMotor, impulse: isNaN(impulse) ? DELETE : impulse });
  }

  function onDelete() {
    util.remove(rtPath);
  }

  return (
    <div className='d-flex flex-wrap flex-sm-nowrap'>
      <div className='d-flex align-items-baseline flex-grow-1 mt-4 mt-sm-2'>
        <div className='d-flex flex-grow-1'>
          <Form.Control
            onChange={onNameChange}
            list='tc-motors'
            value={name}
            className={saving ? 'busy' : ''}
            placeholder='Add motor ...'
            style={{
              borderRight: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />

          <Button
            onClick={() => onDetail(tcMotor)}
            className='p-0 rounded-end border-start-0'
            disabled={!tcMotor}
            style={{
              borderLeft: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          >
            <Image
              src={tcLogo}
              style={tcMotor ? {} : { filter: 'grayscale(1)' }}
            />
          </Button>
        </div>

        {!isPlaceholder ? (
          <>
            <label className='d-inline d-sm-none mx-2'>
              I<sub>t</sub>:
            </label>
            <Form.Control
              className='ms-sm-3'
              style={{ width: '5em' }}
              disabled={!!tcMotor}
              value={impulse ?? ''}
              onChange={onImpulseChange}
            />
          </>
        ) : (
          <div />
        )}
      </div>

      <div className='d-flex flex-grow-1 flex-sm-grow-0 align-items-baseline'>
        {!isPlaceholder ? (
          <>
            <label className='d-inline d-sm-none mx-2'>Delay:</label>
            <datalist id={delayListId}>
              {tcMotor?.delays?.split(',')?.map(d => (
                <option key={String(d)} value={String(d)} />
              ))}
            </datalist>
            <Form.Control
              className='flex-grow-1 ms-sm-2'
              style={{ width: '5em' }}
              list={delayListId}
              value={delay}
              onChange={onDelayChange}
            />
          </>
        ) : (
          <div />
        )}

        {!isPlaceholder ? (
          <>
            <label className='d-inline d-sm-none mx-2'>Stage:</label>
            <FormSelect
              className='flex-grow-1 ms-sm-3'
              style={{ width: '5em' }}
              value={stage}
              onChange={onStageChange}
            >
              <option value='1'>1</option>
              <option value='2'>2</option>
              <option value='3'>3</option>
              <option value='4'>4</option>
            </FormSelect>
          </>
        ) : (
          <div></div>
        )}

        {!isPlaceholder ? (
          <Button
            className='ms-3 mt-2 '
            tabIndex={-1}
            variant='danger'
            onClick={onDelete}
          >
            {'\u2715'}
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
