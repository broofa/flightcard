import React from 'react';

export function Connector({ complete } : {complete ?: boolean}) {
  const id = `arrow-${Math.random().toString(36)}`;

  return <svg width='100%' height='100%' >
      <g className={`connector ${complete ? 'complete' : ''}`} fill='black' stroke='black' strokeWidth='1'>
        <marker id={id} refX='10' refY='5'
            markerWidth='610' markerHeight='10'
            orient='auto-start-reverse'>
        <path d='M 0 0 L 10 5 L 0 10 z' strokeWidth='0' />
        </marker>
        <line x1='0' y1='50%' x2='100%' y2='50%' markerEnd={`url(#${id})`}/>
      </g>
    </svg>;
}

export function Step({ complete, children, ...props }) {
  return <span className={`text-light bg-dark step ${complete ? 'complete' : ''}`} {...props}>
    {children}
  </span>;
}

export function Stepper({ className, children, ...props }) {
  children = children.filter(c => c.type === Step);
  const ch = [children.shift()];
  for (const child of children) {
    ch.push(<Connector complete={child.props.complete} />);
    ch.push(child);
  }

  return <div className={`${className ?? ''} stepper`} {...props}>
    {ch}
  </div>;
}
