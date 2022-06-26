import React, {
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-bootstrap';
import './Flash.scss';

let _flashes: ReactNode[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let onFlashChange = (flashes: ReactNode[]) => {};

function addFlash(node: ReactNode) {
  _flashes = [..._flashes, node];
  onFlashChange(_flashes);

  // Return a function to remove the flash
  return () => removeFlash(node);
}

function removeFlash(node: ReactNode) {
  _flashes = _flashes.filter(n => n !== node);
  onFlashChange(_flashes);
}

export function flash(node: ReactNode | Error | string) {
  if (node instanceof Error) {
    console.log(node);
    node = <Alert variant='danger'>{node.message}</Alert>;
  } else if (typeof node === 'string') {
    node = <Alert variant='success'>{node}</Alert>;
  }

  const unflash = addFlash(node);
  setTimeout(unflash, 10000);
}

export function errorTrap<T>(action: Promise<T>): Promise<T> {
  action.catch(err => flash(err));
  return action;
}

export function FlashItem({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;

    if (el) {
      el.style.height = `${el.scrollHeight}px`;
      el.ontransitionend = () => {
        el.style.height = 'auto';
      };
    }
  }, [ref]);

  return (
    <div className={`flash-item ${className}`} ref={ref} {...props}>
      {children}
    </div>
  );
}

export function FlashList(props: HTMLAttributes<HTMLDivElement>) {
  const [flashes, setFlashes] = useState(_flashes);

  onFlashChange = setFlashes;

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
