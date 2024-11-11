import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { FlashItem } from '/components/Flash/FlashItem';
import type { FlashEvent } from '/components/Flash/flash';

export function FlashList(props: HTMLAttributes<HTMLDivElement>) {
  const [flashes, setFlashes] = useState([] as ReactNode[]);

  useEffect(() => {
    function onFlashChange(e: FlashEvent) {
      setFlashes(e.detail);
    }
    document.addEventListener('flashEvent', onFlashChange);
    return () => document.removeEventListener('flashEvent', onFlashChange);
  }, []);

  return (
    <>
      <div {...props}>
        {flashes.map((node, i) => {
          return <FlashItem key={i}>{node}</FlashItem>;
        })}
      </div>
    </>
  );
}
