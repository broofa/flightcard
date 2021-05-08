import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { tChildren, tProps } from './util';

export default function Editor(
  { className, children, onSave, onCancel, onDelete, ...props }
  : {
    className ?: string,
    onSave ?: (e ?: any) => any,
    onCancel ?: (e ?: any) => any,
    onDelete ?: (e ?: any) => any,
    children : tChildren,
    } & tProps
) {
  function onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) onSave();
  }
  const contents = <>
    {children}

    <div style={{ marginTop: '2em', display: 'flex' }}>
      {onSave ? <Button type='submit' className='mr-5'>Save</Button> : null}
      <div style={{ flexGrow: 1 }} />
      {onCancel ? <Button onClick={onCancel} variant='secondary'>Cancel</Button> : null}
      {onDelete ? <Button onClick={onDelete} variant='danger' className='ml-5'>Delete</Button> : null}
    </div>
  </>;

  return <Form onSubmit={onSubmit} className={`editor ${className ?? ''}`} {...props}>
    {contents}
  </Form>;
}
