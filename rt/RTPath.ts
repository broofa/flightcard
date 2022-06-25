/**
 * Typed realtime path support.  RTPath instances are immutable, and consist of
 * a path template like "/users/:launchId/:userId" and an optional field tokens
 * object (e.g. {launchId: '123', userId: '456'}) to use when rendering the path
 * to a string.
 *
 * RTPaths do double duty as both path templates, and as path strings.  Because
 * of this, they are allowed to exist in "invalid" states where an instance may
 * not have the fields needed to wholly render a path.   In this case,
 * attempting to convert the path to a string will throw an error!  Callers are
 * expected to validate any path prior to using it.  To that end, paths support
 * validate() and isValid() methods.
 */

import { nanoid } from 'nanoid';

type FieldsBase = Record<string, string>;
const memos = new Map<string, RTPath>();

export class RTPath<Fields = FieldsBase> {
  private path: string | undefined;
  private errorString: string | undefined;
  id: string = nanoid();

  constructor(readonly template: string, private readonly fields?: Fields) {
    if (template.endsWith('/'))
      throw Error('Path template must not end with /');
    // Ad-hoc memoization here avoids the need for useMemo() in components. Yes,
    // this is a memory leak, but it's not expected to be an issue in practice.
    const fieldKey = fields
      ? Object.entries(fields ?? {})
          .map(([k, v]) => `${k}:${v}`)
          .join(', ')
      : '';
    const memoKey = `${template} (${fieldKey})`;
    const instance = memos.get(memoKey);
    if (instance) {
      return instance as unknown as RTPath<Fields>;
    }

    memos.set(memoKey, this as unknown as RTPath);

    this.render(fields);
  }

  private render(fields?: Fields) {
    const missing: string[] = [];
    const path = this.template.replace(/:\w+/g, match => {
      const token = match.substring(1);
      const val = (fields as unknown as FieldsBase)?.[token];
      if (!val) {
        missing.push(token);
      }
      return val || '<missing>';
    });
    if (path) {
      this.path = path;
    }
    if (missing.length) {
      this.errorString = `Missing fields: ${missing.join(', ')} in ${
        this.template
      }`;
    }
  }

  with(fields?: Fields) {
    return new RTPath<Fields>(this.template, fields);
  }

  append<T = FieldsBase>(subpath: string, extraFields?: T) {
    const newFields = extraFields
      ? // Not sure why I have to explicitly cast the type here :-/
        ({ ...this.fields, ...extraFields } as Fields & T)
      : undefined;
    return new RTPath<Fields & T>(this.template + '/' + subpath, newFields);
  }

  isValid() {
    return !this.errorString;
  }

  get errorMessage() {
    return this.errorString;
  }

  toString() {
    if (this.errorString) throw Error(this.errorString);
    if (!this.path) throw Error('Undefined path'); // This should never throw
    return this.path;
  }
}
