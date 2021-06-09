import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

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

export function ProfileLink({ launchId }) {
  return <Link to={`/launches/${launchId}/profile`}>Profile Page</Link>;
}

export function AttendeesLink({ launchId }) {
  return <Link to={`/launches/${launchId}/users`}>Attendee Page</Link>;
}

/**
 * Style a DOMElement as "busy" during an async operation
 */
export function busy(target, p) {
  target = target.target ?? target; // Extract target from DOMEvents

  // Start busy animation
  target.classList.toggle('busy', true);

  // Stop busy animation when promise settles
  p.finally(() => target.classList.toggle('busy', false));

  return p;
}

/**
 * Round number to X significant digits
 */
export function sig(val : number, digits = 3) {
  if (val === 0 || !isFinite(val)) return val;

  const isNegative = val < 0;
  if (isNegative) val = -val;
  const man = digits - Math.ceil(Math.log10(val));
  if (man > 0) {
    val = Math.round(val * 10 ** man) / 10 ** man;
  } else {
    val = Math.round(val);
  }

  return isNegative ? -val : val;
}
