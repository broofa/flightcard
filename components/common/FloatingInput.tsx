import React, { cloneElement, ReactElement } from 'react';
import { tChildren, tProps } from './util';

export function FloatingInput({ className, children, ...props } :
  {
    className ?: string;
    children : tChildren;
  } & tProps) {
  const label = children as ReactElement;

  let id = label.props.children;
  if (Array.isArray(id)) {
    id = id.find(v => typeof (v) == 'string');
  }
  id = id.replace(/\s+/g, '_').toLowerCase();

  return <div className={`form-floating ${className ?? ''}`}>
    <input
      id={id}
      placeholder={id}
      className='form-control'
      {...props} />

    {cloneElement(label, { htmlFor: id })}
  </div>;
}
