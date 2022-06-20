import React from 'react';
import { MKS, tUnitSystem, unitConvert } from '../../util/units';
import { useUserUnits } from '../contexts/derived';
import { sig } from '/components/common/util';

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

  return (
    <>
      {sig(unitConvert(value, fromUnit, toUnit))}
      {long ? ' ' + userUnits[type] : null}
    </>
  );
}
