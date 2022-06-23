import React, { HTMLAttributes } from 'react';

const COLORS = new Set([
  'black',
  'blue',
  'brown',
  'gold',
  'gray',
  'green',
  'grey',
  'lime',
  'blue',
  'magenta',
  'orange',
  'pink',
  'purple',
  'red',
  'silver',
  'tan',
  'turquoise',
  'violet',
  'white',
  'yellow',
]);

export default function ColorChits({
  colors,
  className,
  ...props
}: { colors: string } & HTMLAttributes<HTMLDivElement>) {
  const match = colors?.match(/\w+/g)?.map(v => v.toLowerCase());
  if (!match) return null;

  return (
    <div
      className={`d-flex ${className ?? ''}`}
      style={{ height: '1em', gap: '.5em' }}
      {...props}
    >
      {match.map((color, i) =>
        COLORS.has(color) ? (
          <div
            className='flex-grow-1 rounded border border-dark'
            style={{ backgroundColor: color }}
            key={`chit-${i}`}
          ></div>
        ) : null
      )}
    </div>
  );
}
