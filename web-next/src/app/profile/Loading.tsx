import type { HTMLAttributes } from 'react';

export function Loading({
  wat,
  ...props
}: { wat: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className='busy'
      style={{
        fontSize: '1.3rem',
        fontWeight: 'bold',
        opacity: 0.3,
        textAlign: 'center',
      }}
      {...props}
    >
      Loading {wat}
    </div>
  );
}
