import React, { HTMLAttributes, useContext } from 'react';
import { MKS, tUnitSystem, unitConvert } from '../../util/units';
import { AppContext } from '../App/App';
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
} & HTMLAttributes<HTMLSpanElement>) {
  const { userUnits } = useContext(AppContext);
  const fromUnit = MKS[type];
  const toUnit = userUnits[type];

  return (
    <>
      {sig(unitConvert(value, fromUnit, toUnit))}
      {long ? ' ' + userUnits[type] : null}
    </>
  );
}
