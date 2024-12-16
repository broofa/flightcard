import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import './Busy.css';
import { cn } from './cn';

export function BusySpinner({
  className,
  size = 'md',
  ...props
}: { size?: 'sm' | 'md' | 'lg' } & HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className, 'busy-spinner', `busy-spinner-${size}`)} {...props} />;
}

export function BusyButton({
  busy,
  className,
  children,
  disabled,
  ...props
}: {
  busy: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const spinner = busy ? <BusySpinner /> : null;
  return (
    <button
      className={cn(className, 'busy-button')}
      disabled={disabled || busy}
      {...props}
    >
      {children}
      {busy ? (
        <div className='busy-button-grid'>
          <BusySpinner size='lg'/>
        </div>
      ) : null}
    </button>
  );
}
