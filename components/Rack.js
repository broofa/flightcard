import React from 'react';
import Pad from './Pad.js';

export default function Launch({ rack }) {
  return <div>
    <h2>{rack.name}</h2>
    {rack.pads.map(pad => <Pad key={pad.id} pad={pad} />)}
  </div>;
}
