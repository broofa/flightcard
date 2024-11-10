import React, {
  cloneElement,
  type ForwardedRef,
  type InputHTMLAttributes,
  type ReactElement,
} from 'react';
import { cn } from './util';

function FloatingInput(
  {
    className,
    style,
    children,
    ...props
  }: InputHTMLAttributes<HTMLInputElement>,
  ref: ForwardedRef<HTMLInputElement>
) {
  const label = children as ReactElement;

  let id = label.props.children;
  if (Array.isArray(id)) {
    id = id.find((v) => typeof v === 'string');
  }
  id = id.replace(/\s+/g, '_').toLowerCase();

  return (
    <div style={style} className={cn(className, 'form-floating')}>
      <input
        ref={ref}
        id={id}
        placeholder={id}
        className='form-control'
        {...props}
      />

      {cloneElement(label, { htmlFor: id, style: { whiteSpace: 'nowrap' } })}
    </div>
  );
}

export default React.forwardRef(FloatingInput);
