import React, { cloneElement, ReactElement } from 'react';
import { tChildren, tProps } from './util';

function FloatingInput({ className, children, ...props }
  : {className ?: string, children ?: tChildren} & tProps & {list ?: string},
ref) {
  const label = children as ReactElement;

  let id = label.props.children;
  if (Array.isArray(id)) {
    id = id.find(v => typeof (v) == 'string');
  }
  id = id.replace(/\s+/g, '_').toLowerCase();

  return <div className={`form-floating  ${className ?? ''}`}>
    <input
      ref={ref}
      id={id}
      placeholder={id}
      className='form-control'
      {...props} />

    {cloneElement(label, { htmlFor: id, style: { whiteSpace: 'nowrap' } })}
  </div>;
}

export default React.forwardRef(FloatingInput);
