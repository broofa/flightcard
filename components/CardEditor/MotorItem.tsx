import { nanoid } from 'nanoid';
import React, {
  ChangeEvent,
  HTMLAttributes,
  useContext,
  useState,
} from 'react';
import { Button, Form, FormSelect, Image } from 'react-bootstrap';
import { Motor } from 'thrustcurve-db';
import { getMotorByDisplayName } from '../../util/motor-util';
import { MKS, unitConvert, unitParse } from '../../util/units';
import { BLANK_ID } from './MotorList';
import tcLogo from '/art/thrustcurve.png'; // 'Wish there was a way to ignore VSCode error here
import { AppContext } from '/components/app/App';
import { sig } from '/components/common/util';
import { DELETE } from '/firebase';
import { iMotor } from '/types';

type tMotorFields = {
  name: string;
  delay: string;
  impulse: string;
  stage: string;
};

export function MotorItem({
  motor,
  onChange,
  onDetail,
}: {
  motor: iMotor;
  onChange: (motor?: iMotor) => void;
  onDetail: (motor?: Motor) => void;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const [delayListId] = useState(nanoid());
  const tcMotor = getMotorByDisplayName(motor?.name);
  const { userUnits } = useContext(AppContext);

  const [fields, setFields] = useState<tMotorFields>({
    name: motor?.name ?? '',
    stage: String(motor?.stage ?? '1'),
    delay: String(motor?.delay ?? ''),
    impulse: motor?.impulse
      ? String(unitConvert(motor.impulse, MKS.impulse, userUnits.impulse))
      : '',
  });

  const delays = tcMotor?.delays?.split(',');

  function patchFields(patch: Partial<tMotorFields>) {
    const newFields: tMotorFields = { ...fields, ...patch };
    setFields(newFields);

    // Create new Motor
    const newMotor: iMotor = {
      id: nanoid(),
      name: newFields.name,
      impulse: DELETE,
      delay: DELETE,
      stage: DELETE,
      tcMotorId: DELETE,
    };

    const _tcMotor = getMotorByDisplayName(newMotor.name);
    if (_tcMotor) newMotor.tcMotorId = _tcMotor.motorId;

    if (newFields.delay) newMotor.delay = Number(newFields.delay);
    if (newFields.stage != '1') newMotor.stage = Number(newFields.stage);
    if (newFields.impulse) {
      try {
        newMotor.impulse = unitParse(
          newFields.impulse,
          userUnits.impulse,
          MKS.impulse
        );
      } catch (err) {
        // Fail silently - this should be surfaced via validity message
      }
    }

    onChange(newMotor);
  }

  function onNameChange({ target }) {
    const name = target.value;
    const patch: Partial<tMotorFields> = { name };

    const _tcMotor = getMotorByDisplayName(name);
    if (_tcMotor) {
      patch.impulse = String(
        sig(unitConvert(_tcMotor.totImpulseNs, MKS.impulse, userUnits.impulse))
      );
    }
    patchFields(patch);
  }

  function onImpulseChange({ type, target }) {
    const val: string = target.value;

    // Is value parsable
    let parsed: number | undefined;
    try {
      target.setCustomValidity('');
      parsed = unitParse(val, userUnits.impulse);
    } catch (err) {
      const { message } = err as Error;
      target.setCustomValidity(message);
    }

    if (type == 'blur' && parsed) {
      patchFields({ impulse: String(sig(parsed)) });
    } else {
      patchFields({ impulse: val });
    }

    target.reportValidity();
  }

  return (
    <div className='d-flex flex-wrap flex-sm-nowrap'>
      <div className='d-flex align-items-baseline flex-grow-1 mt-4 mt-sm-2'>
        <div className='d-flex flex-grow-1'>
          <Form.Control
            onChange={onNameChange}
            list='tc-motors'
            value={fields?.name ?? ''}
            placeholder='Add motor ...'
            style={{
              borderRight: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />

          <Button
            onClick={() => onDetail?.(tcMotor)}
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

        {fields?.name ? (
          <>
            <label className='d-inline d-sm-none mx-2'>
              I<sub>t</sub>:
            </label>
            <Form.Control
              className='ms-sm-3'
              style={{ width: '5em' }}
              disabled={!!tcMotor}
              value={fields.impulse ?? ''}
              onChange={onImpulseChange}
              onBlur={onImpulseChange}
            />
          </>
        ) : (
          <div />
        )}
      </div>

      <div className='d-flex flex-grow-1 flex-sm-grow-0 align-items-baseline'>
        {fields?.name ? (
          <>
            <label className='d-inline d-sm-none mx-2'>Delay:</label>
            <datalist id={delayListId}>
              {delays?.map(d => (
                <option key={String(d)} value={String(d)} />
              ))}
            </datalist>
            <Form.Control
              className='flex-grow-1 ms-sm-2'
              style={{ width: '5em' }}
              list={delayListId}
              value={fields.delay ?? ''}
              onChange={e => patchFields({ delay: e.target.value })}
            />
          </>
        ) : (
          <div />
        )}

        {fields?.name ? (
          <>
            <label className='d-inline d-sm-none mx-2'>Stage:</label>
            <FormSelect
              className='flex-grow-1 ms-sm-3'
              style={{ width: '5em' }}
              value={fields.stage ?? ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                patchFields({ stage: e.target.value })
              }
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

        {motor.id !== BLANK_ID ? (
          <Button
            className='ms-3 mt-2 '
            tabIndex={-1}
            variant='danger'
            onClick={() => onChange(undefined)}
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
