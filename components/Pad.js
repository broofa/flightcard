import React from 'react';

export default function Launch({ pad }) {
  return <button style={{ fontSize: '20pt', margin: '0em 1em', minWidth: '3em' }}>{pad.name}</button>;
}
