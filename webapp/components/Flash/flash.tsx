import React, { ReactNode } from 'react';
import { Alert } from 'react-bootstrap';

export type FlashEvent = CustomEvent<ReactNode[]>;

declare global {
  interface DocumentEventMap {
    flashEvent: FlashEvent;
  }
}

let _flashes: ReactNode[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onFlashChange = (flashes: ReactNode[]) => {};

function addFlash(node: ReactNode) {
  _flashes = [..._flashes, node];
  const flashEvent: FlashEvent = new CustomEvent<ReactNode[]>('flashChange', {
    detail: _flashes,
  });
  document.dispatchEvent(flashEvent);

  // Return a function to remove the flash
  return () => removeFlash(node);
}

function removeFlash(node: ReactNode) {
  _flashes = _flashes.filter((n) => n !== node);
  onFlashChange(_flashes);
}

export function flash(node: ReactNode | Error | string) {
  if (node instanceof Error) {
    node = <Alert variant='danger'>{node.message}</Alert>;
  } else if (typeof node === 'string') {
    node = <Alert variant='success'>{node}</Alert>;
  }

  const unflash = addFlash(node);
  setTimeout(unflash, 10000);
}
