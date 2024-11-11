import { sig } from '../common/util';
import { useUserUnits } from '../contexts/rt_hooks';
import { MKS, type tUnitSystem, unitConvert } from '/util/units';

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
      {Number.isNaN(converted)
        ? '?'
        : `${sig(converted)} ${long ? ' ' + userUnits[type] : null}`}
    </>
  );
}
