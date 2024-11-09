import React, { cloneElement, isValidElement, useEffect, useRef } from 'react';
import { useLog } from './AdminLogger';
import MigrateDB from './MigrateDB';
import MockDB from './MockDB';
import MotorStats from './MotorStats';
import TestDB from './TestDB';
import TestUtil from './TestUnits';

export default function Admin() {
  const log = useLog();
  const logList = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logEl = logList.current;
    if (!logEl) return;
    // @ts-ignore - typescript doesn't know about scrollTo
    (logEl.lastChild as HTMLElement)?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <>
      <h2>Probably-Safe Zone</h2>
      <section className='deck'>
        <TestDB />
        <TestUtil />
        <MotorStats />
      </section>

      <h2>Danger Zone</h2>
      <section className='deck'>
        <MockDB />
        <MigrateDB />
      </section>

      <div
        ref={logList}
        className='mt-4 text-dark font-monospace'
        style={{ fontSize: '9pt' }}
      >
        {log.map((args, i) => {
          if (isValidElement(args[0])) {
            return cloneElement(args[0], { key: i });
          }

          const err: Error | undefined = args.find(
            (v: unknown) => v instanceof Error
          );
          args = args.map((v: unknown) => {
            if (v === undefined) return 'undefined';
            const cons = Object.getPrototypeOf(v)?.constructor;
            if (cons === Object || cons === Array) {
              return JSON.stringify(v);
            }
            return v;
          });

          return (
            <div key={i} className={err ? 'text-danger' : ''}>
              {args.join(' ')}
            </div>
          );
        })}
      </div>
    </>
  );
}
