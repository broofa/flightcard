import React from 'react';
import { Form, Button } from 'react-bootstrap';

const Editor : React.FC<{
  className ?: string,
  onSubmit ?: (e : any) => void,
  onCancel ?: (e : any) => void,
  onDelete ?: (e : any) => void,
  children : React.ReactElement[],
}> = ({ className, children, onSubmit, onCancel, onDelete, ...props }) => {
  const contents = <>
    {children}

    <div style={{ marginTop: '2em', display: 'flex' }}>
      {onDelete ? <Button onClick={onDelete} variant='danger'>Delete</Button> : null}
      <div style={{ flexGrow: 1 }} />
      {onCancel ? <Button onClick={onCancel} variant='secondary'>Cancel</Button> : null}
      {onSubmit ? <Button type="submit" style={{ marginLeft: '1em' }}>Save</Button> : null}
    </div>
  </>;

  return <Form onSubmit={onSubmit} className={`editor ${className || ''}`} {...props}>
        {contents}
      </Form>;
};

export default Editor;
