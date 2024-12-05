import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import './Busy.css';
import { cn } from './cn';

export function BusySpinner({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className, 'busy-spinner')} {...props} />;
}

export function BusyButton({
  busy,
  className,
  children,
  ...props
}: {
  busy: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const spinner = busy ? <BusySpinner /> : null;
  return (
    <button {...props} className={cn(className, 'busy-button')} disabled={busy}>
      {children}
      {busy ? (
        <div className='busy-button-grid'>
          <BusySpinner />
        </div>
      ) : null}
    </button>
  );
}
