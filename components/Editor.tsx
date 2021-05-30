import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { tChildren, tProps } from './common/util';

export default function Editor(
  { children, onSave, onCancel, onDelete, ...props }
  : {
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
      {onCancel ? <Button onClick={onCancel} variant='secondary'>Cancel</Button> : null}
      {onDelete ? <Button onClick={onDelete} variant='danger' className='ms-5'>Delete</Button> : null}
      <div style={{ flexGrow: 1 }} />
      {onSave ? <Button type='submit'>Save</Button> : null}
    </div>
  </>;

  return <Form onSubmit={onSubmit} {...props}>
    {contents}
  </Form>;
}
