import React from 'react';
import { Alert, Modal, ModalProps } from 'react-bootstrap';
import { TCMotor } from 'thrustcurve-db';
import { Sparky } from '../common/Sparky';
import { MKSValue } from './MKSValue';
import { sig } from '/components/common/util';
import { motorDisplayName } from '/util/motor-util';

export const fire = new URL('/art/fire.gif', import.meta.url).toString();

export function MotorDetail({
  motor,
  ...props
}: { motor: TCMotor } & ModalProps) {
  let graph;
  const { samples } = motor;
  if (samples) {
    const W = 400;
    const H = 100;
    const tMax = samples[samples.length - 1][0];
    const vMax = samples.map(([, v]) => v).reduce((a, b) => Math.max(a, b), 0);
    const yAvg = H * (1 - (0.9 * motor.avgThrustN) / vMax);

    const points = samples.map(
      ([t, v]) => `${sig(W * (t / tMax))},${sig(H * (1 - (0.9 * v) / vMax))}`
    );

    graph = (
      <svg
        className='border border-secondary rounded'
        width='100%'
        viewBox={`0 0 ${W} ${H}`}
        strokeWidth='2'
        height='10%'
        preserveAspectRatio='none'
      >
        <polyline
          stroke='black'
          strokeWidth='1'
          fill='lightgrey'
          points={points.join(' ')}
        />
        <line
          x1='0'
          y1={yAvg}
          x2={W}
          y2={yAvg}
          strokeWidth='2'
          strokeDasharray='10 4'
          stroke='green'
        />
      </svg>
    );
  }

  return (
    <Modal show={true} {...props}>
      <Modal.Header closeButton className='fw-bold'>
        {motorDisplayName(motor)}
      </Modal.Header>
      <Modal.Body>
        {graph}
        <div className='d-flex'>
          <div className='text-start small'>0 sec</div>
          <div className='text-end small flex-grow-1'>
            {motor.burnTimeS} sec
          </div>
        </div>

        <div
          className='d-grid'
          style={{ gridTemplateColumns: 'max-content 1fr', gap: '0.5em 1em' }}
        >
          <div>Total Impulse</div>
          <div>
            <MKSValue value={motor.totImpulseNs} type='impulse' long />
          </div>
          <div>Max Thrust</div>
          <div>
            <MKSValue value={motor.maxThrustN} type='force' long />
          </div>
          <div>Average Thrust</div>
          <div>
            <MKSValue value={motor.avgThrustN} type='force' long />
          </div>
          <div>Propellent</div>
          <div>
            <div>{motor.propInfo}</div>
          </div>
        </div>
        {motor.sparky ? (
          <Alert variant='warning' className='d-flex'>
            <Sparky className='m-auto' />
            <div className='flex-grow-1'>
              Heads up! Sparky motors may not be allowed at some launches. Check
              with the RSO.
            </div>
          </Alert>
        ) : null}
      </Modal.Body>
    </Modal>
  );
}
