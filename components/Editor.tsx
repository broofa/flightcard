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
      {onDelete ? <Button onClick={onDelete} variant='danger'>Delete</Button> : null}
      <div style={{ flexGrow: 1 }} />
      {onCancel ? <Button onClick={onCancel} variant='secondary'>Cancel</Button> : null}
      {onSave ? <Button type='submit' style={{ marginLeft: '1em' }}>Save</Button> : null}
    </div>
  </>;

  return <Form onSubmit={onSubmit} className={`editor ${className ?? ''}`} {...props}>
    {contents}
  </Form>;
}
