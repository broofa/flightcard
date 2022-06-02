import React, { cloneElement, isValidElement } from 'react';
import { useLog } from './AdminLogger';
import MigrateDB from './MigrateDB';
import SeedDB from './SeedDB';
import TestDB from './TestDB';
import TestUtil from './TestUtil';

export default function Admin() {
  const log = useLog();

  // Trigger re-render when log changes
  return (
    <>
      <div className='deck'>
        <TestDB />
        <TestUtil />

        {/* Dangerous shit */}
        <SeedDB />
        <MigrateDB />
      </div>

      <div
        className='mt-4 text-dark font-monospace'
        style={{ fontSize: '9pt' }}
      >
        {log.map((args, i) => {
          if (isValidElement(args[0])) {
            return cloneElement(args[0], { key: 1 });
          }

          const err = args.find(v => v instanceof Error);
          args = args.map(v => {
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
