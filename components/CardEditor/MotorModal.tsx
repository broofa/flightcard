import React from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { Motor as TCMotor } from 'thrustcurve-db';
import { motorDisplayName } from '../../util/motor-util';
import { MKSValue } from './MKSValue';
import { sig } from '/components/common/util';

export function MotorModal({ motor, ...props }: { motor: TCMotor } & ModalProps) {
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
      <Modal.Header closeButton>{motorDisplayName(motor)}</Modal.Header>
      <Modal.Body>
        {graph}
        <div className='d-flex'>
          <div className='text-start small'>0 sec</div>
          <div className='text-end small flex-grow-1'>
            {motor.burnTimeS} sec
          </div>
        </div>

        <div className='d-grid' style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>Max thrust</div>
          <div>
            <MKSValue value={motor.maxThrustN} type='force' long />
          </div>
          <div>Average thrust</div>
          <div>
            <MKSValue value={motor.avgThrustN} type='force' long />
          </div>
          <div>Propellent</div>
          <div>{motor.propInfo}</div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
