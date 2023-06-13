import React from 'react';
import { Button } from 'react-bootstrap';
import { clear, log } from './AdminLogger';
import { MKS, unitParse } from '/util/units';

async function handleClick() {
  clear();
  log('Starting tests');

  function expectUnit(v: string, unit: string, expected: number) {
    const actual = parseFloat(unitParse(v, unit).toPrecision(4));
    try {
    } catch (err) {
      log(v, unit, 'ERROR', (err as Error).message);
      return;
    }

    if ((isNaN(actual) && isNaN(expected)) || actual === expected) {
      log('\u2705', v, 'to', unit, '=', expected);
    } else {
      log(
        '\u274c',
        v,
        'to',
        unit,
        '=',
        String(actual),
        `(expected ${expected})`
      );
    }
  }

  // Misc
  expectUnit('1.23', MKS.mass, 1.23); // unitless
  expectUnit('-1.23', MKS.mass, -1.23); // negative
  expectUnit('1ft', MKS.mass, NaN); // incompatible units

  // Incompatible units

  // Metric units
  expectUnit('1m', MKS.length, 1);
  expectUnit('1kg', MKS.mass, 1);
  expectUnit('1n', MKS.force, 1);
  expectUnit('1n-s', MKS.impulse, 1);
  expectUnit('1n-sec', MKS.impulse, 1);

  // US length
  expectUnit('1ft', MKS.length, 0.3048);
  expectUnit('1 ft', MKS.length, 0.3048);
  expectUnit('1 FT', MKS.length, 0.3048);
  expectUnit("1'", MKS.length, 0.3048);
  expectUnit('1in', MKS.length, 0.0254);
  expectUnit('1"', MKS.length, 0.0254);
  expectUnit('1ft1in', MKS.length, 0.3302);
  expectUnit('1 ft 1 in', MKS.length, 0.3302);
  expectUnit('1ft 1in', MKS.length, 0.3302);
  expectUnit('1cm', MKS.length, 0.01);
  expectUnit('1mm', MKS.length, 0.001);

  // test mass
  expectUnit('1lb', MKS.mass, 0.4536);
  expectUnit('1oz', MKS.mass, 0.02835);
  expectUnit('1lb1oz', MKS.mass, 0.4819);
  expectUnit('1g', MKS.mass, 0.001);

  // test force
  expectUnit('1lbf', MKS.force, 4.448);

  // test impulse
  expectUnit('1lbf-s', MKS.impulse, 4.448);
  expectUnit('1lbf-sec', MKS.impulse, 4.448);
}

export default function TestUnits() {
  return (
    <Button variant='info' onClick={handleClick}>
      Test Units
    </Button>
  );
}
