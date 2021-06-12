import React from 'react';
import { Button, Form, FormProps } from 'react-bootstrap';

export default function Editor(
  { children, onSave, onCancel, onDelete, ...props }
  : {
    onSave ?: (e ?: any) => any,
    onCancel ?: (e ?: any) => any,
    onDelete ?: (e ?: any) => any,
    } & FormProps
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
      {onSave ? <Button type='submit' className='ms-3'>Save Card</Button> : null}
    </div>
  </>;

  return <Form onSubmit={onSubmit} {...props}>
    {contents}
  </Form>;
}
