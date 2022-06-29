import React, { HTMLAttributes } from 'react';

// X11 colors, minus really unlikely stuff
export const COLORS = new Set([
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blue',
  'brown',
  'chartreuse',
  'chocolate',
  'coral',
  'crimson',
  'cyan',
  'fuchsia',
  'gainsboro',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'grey',
  'honeydew',
  'hotpink',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lime',
  'linen',
  'magenta',
  'maroon',
  'navy',
  'olive',
  'orange',
  'pink',
  'plum',
  'purple',
  'red',
  'salmon',
  'sienna',
  'silver',
  'snow',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'yellow',
]);

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
