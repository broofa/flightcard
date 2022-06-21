import React, { useState } from 'react';
import { Button, ButtonGroup, ButtonGroupProps } from 'react-bootstrap';
import { playSound, RANGE_CLOSED, RANGE_OPEN } from '../../util/playSound';
import { usePrevious } from '/components/common/util';
import { db } from '/rt';
import { iLaunch } from '/types';

export function RangeStatus({
  launch,
  isLCO,
  ...props
}: { launch: iLaunch; isLCO: boolean } & ButtonGroupProps) {
  const [muted, setMuted] = useState(false);
  const { rangeOpen } = launch;
  const prev = usePrevious(rangeOpen);

  async function rangeClick() {
    await db.launch.update(launch.id, { rangeOpen: !rangeOpen });
  }

  if (!muted && prev !== undefined && prev != rangeOpen)
    playSound(rangeOpen ? RANGE_OPEN : RANGE_CLOSED);

  const variant = rangeOpen ? 'success' : 'danger';
  const text = `Range is ${rangeOpen ? 'Open' : 'Closed'}`;

  return (
    <ButtonGroup {...props}>
      {isLCO ? (
        <Button variant={variant} onClick={rangeClick}>
          {text}
        </Button>
      ) : (
        <Button
          className='fw-bold'
          variant={`outline-${variant}`}
          style={{ opacity: 1 }}
          disabled
        >
          {text}
        </Button>
      )}
      <Button
        variant={`outline-${variant}`}
        title='Toggle announcement volume'
        className='flex-grow-0'
        onClick={() => setMuted(!muted)}
      >
        {muted ? '\u{1F507}' : '\u{1F508}'}
      </Button>
    </ButtonGroup>
  );
}
