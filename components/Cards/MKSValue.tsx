import React from 'react';
import { sig } from '../common/util';
import { useUserUnits } from '../contexts/rthooks';
import { MKS, tUnitSystem, unitConvert } from '/util/units';

// Playing around with a component that knows about unit types

export function MKSValue({
  value,
  type,
  long,
}: {
  value: number;
  long: boolean;
  type: keyof tUnitSystem;
}) {
  const [userUnits = MKS] = useUserUnits();
  const fromUnit = MKS[type];
  const toUnit = userUnits[type];
  const converted = unitConvert(value, fromUnit, toUnit);

  return (
    <>
      {isNaN(converted)
        ? '?'
        : `${sig(converted)} ${long ? ' ' + userUnits[type] : null}`}
    </>
  );
}
