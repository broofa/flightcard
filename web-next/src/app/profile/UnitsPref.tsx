import type { HTMLAttributes } from 'react';

export default function UnitsPref({
  authId,
  ...props
}: { authId: string } & HTMLAttributes<HTMLDivElement>) {
  return <input type='checkbox' className='toggle toggle-lg' defaultChecked />;
}
