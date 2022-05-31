import React, { HTMLAttributes, useEffect, useRef } from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link, LinkProps } from 'react-router-dom';

export function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current as T;
}

export function Loading({
  wat,
  ...props
}: { wat: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className='busy'
      style={{
        fontSize: '1.3rem',
        fontWeight: 'bold',
        opacity: 0.3,
        textAlign: 'center',
      }}
      {...props}
    >
      Loading {wat}
    </div>
  );
}

export function ProfileLink({ launchId }: Omit<LinkProps, 'to'> & { launchId: string }) {
  return <Link to={`/launches/${launchId}/profile`}>Profile Page</Link>;
}

export function AttendeesLink({
  launchId,
  filter,
  children,
  ...props
}: Omit<LinkProps, 'to'> & { launchId: string; filter?: string }) {
  return (
    <Link
      to={`/launches/${launchId}/users${filter ? `?filter=${filter}` : ''}`}
      {...props}
    >
      {children ?? 'Attendee Page'}
    </Link>
  );
}

export function LinkButton({
  to,
  isActive,
  children,
  ...props
}: {
  to: string;
  isActive?: () => boolean;
} & ButtonProps) {
  return (
    <LinkContainer to={to} isActive={isActive}>
      <Button {...props}>{children}</Button>
    </LinkContainer>
  );
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
export function sig(val: number, digits = 3) {
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
