import React, { HTMLAttributes } from 'react';
import { COLORS } from '/constants.js';

export default function ColorChits({
  colors,
  ...props
}: { colors: string } & HTMLAttributes<HTMLDivElement>) {
  if (/rainbow/i.test(colors)) {
    colors = 'red orange yellow green turquoise blue violet';
  }

  const match = colors?.match(/\w+/g)?.map(v => v.toLowerCase());

  if (!match) return null;

  return (
    <>
      {match.map((color, i) =>
        COLORS.has(color) ? (
          <div
            style={{ backgroundColor: color }}
            key={`chit-${i}`}
            {...props}
          ></div>
        ) : null
      )}
    </>
  );
}
