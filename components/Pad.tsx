import React from 'react';
import { iPad } from '/types';

export default function Pad({ pad }: { pad: iPad }) {
  return (
    <button style={{ fontSize: '20pt', margin: '0em 1em', minWidth: '3em' }}>
      {pad.name}
    </button>
  );
}
