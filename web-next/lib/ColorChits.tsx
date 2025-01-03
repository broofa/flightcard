import { ROCKET_COLORS } from '@flightcard/models';
import type { HTMLAttributes } from 'react';

const COLORS = new Set(ROCKET_COLORS);

export default function ColorChits({
  colors: text = '',
  ...props
}: { colors: string } & HTMLAttributes<HTMLDivElement>) {
  text = text.toLowerCase();
  const colors = text.split(/\W+/).filter((v) => COLORS.has(v));
  if (!colors.length) {
    colors.push('black', 'white');
  }
  if (text.includes('rainbow')) {
    colors.push(
      'red',
      'orange',
      'yellow',
      'green',
      'turquoise',
      'blue',
      'violet'
    );
  }

  return (
    <>
      {colors.map((color, i) => (
        <div style={{ backgroundColor: color }} key={`chit-${i}`} {...props} />
      ))}
    </>
  );
}
