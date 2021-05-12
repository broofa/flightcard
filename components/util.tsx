import React, { useEffect, useRef } from 'react';

export type tProps = React.HTMLAttributes<any>;
export type tChildren = tChildren[] | React.ReactElement | string | null | undefined;

export function usePrevious<T>(value : T) {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; });
  return ref.current as T;
}

export function Loading({ wat, ...props } : {wat : string} & tProps) {
  return <div {...props}>Loading {wat}</div>;
}

export function sortArray<T = any>(arr : T[], extractor : string | ((a : T) => any)) : T[] {
  const comparator = typeof extractor == 'string'
    ? function(a : any, b : any) {
      a = a[extractor];
      b = b[extractor];
      return a < b ? -1 : a > b ? 1 : 0;
    }
    : function(a, b) {
      a = extractor(a);
      b = extractor(b);
      return a < b ? -1 : a > b ? 1 : 0;
    };

  arr.sort(comparator);

  return arr;
}

/**
 * Round number to X significant digits
 */
export function sig(val : number, digits = 3) {
  const man = digits - Math.ceil(Math.log10(val));
  return man > 0 ? Math.round(val * 10 ** man) / 10 ** man : Math.round(val);
}
