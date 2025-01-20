/**
 * SQL string escaping, forked from https://github.com/mysqljs/sqlstring, with
 * extensive changes for...
 *
 * - Port to TS / modern JS
 * - Convert to ESM
 * - Remove backslash-related escaping (not supported in sqlite)
 * - Remove `Buffer` conversion suppert (obsolete)
 * - Remove timezone madness for dates (ISO8601 FTW!)
 * - Support function values
 * - Add support for Maps and Sets
 */

/**
 * sql-escape arbitrary values
 */
export function escapeSQL(val: unknown, stringifyObjects = false): string {
  // Would prefer to do Map/Set conversion lower down, inside the `case
  // 'object'` block, but that causes val to become `unknown` due to
  // https://github.com/microsoft/TypeScript/issues/27706
  if (val instanceof Map) {
    val = Object.fromEntries(val);
  } else if (val instanceof Set) {
    val = Array.from(val);
  }

  if (val === undefined || val === null) {
    return 'NULL';
  }

  switch (typeof val) {
    case 'boolean':
      return val ? 'true' : 'false';
    case 'number':
      return String(val);
    case 'function':
      throw new TypeError('Function values are not supported');
    case 'object':
      if (val instanceof Date) {
        return escapeString(val.toISOString());
      }

      if (Array.isArray(val)) {
        return escapeArray(val);
      }

      if (val instanceof Uint8Array) {
        return escapeBytes(val);
      }

      if ('toSqlString' in val && typeof val.toSqlString === 'function') {
        return String(val.toSqlString());
      }

      if (stringifyObjects) {
        return escapeString(String(val));
      }

      return escapeObject(val);

    default:
      return escapeString(String(val));
  }
}

/**
 * sql-escape identifiers
 */
export function escapeId(val: unknown, forbidQualified = false): string {
  if (Array.isArray(val)) {
    return val
      .flat()
      .map((v) => escapeId(v, forbidQualified))
      .join(', ');
  }

  const stringVal = String(val).replaceAll('`', '``');

  return forbidQualified
    ? `\`${stringVal}\``
    : stringVal
        .split('.')
        .map((v) => '`' + v + '`')
        .join('.');
}

export function compose(
  sql: string,
  vars?: unknown | unknown[],
  stringifyObjects = false
) {
  if (vars == null) {
    return sql;
  }

  if (!Array.isArray(vars)) {
    return compose(sql, [vars], stringifyObjects);
  }

  let varIndex = 0;

  const result = sql.replaceAll(
    /(\?+)(\d+)?/g,
    (match, marks: string, digits: string) => {
      if (marks.length > 2) {
        // 3 or more ?'s should be ignored
        return match;
      }

      const escaper = marks.length === 1 ? escapeSQL : escapeId;
      if ((digits?.length ?? 0) > 0) {
        varIndex = Number.parseInt(digits, 10) - 1;
      }

      if (varIndex >= vars.length) {
        throw new RangeError(
          `var index ${varIndex} > # of vars provided (${vars.length})`
        );
      }

      return escaper(vars[varIndex++], stringifyObjects);
    }
  );

  return result;
}

export function raw<T>(sql: T) {
  if (typeof sql !== 'string') {
    throw new TypeError('argument sql must be a string');
  }

  return {
    toSqlString: function toSqlString(): T {
      return sql;
    },
  };
}

/**
 * sqlEscape arrays
 */
function escapeArray(array: unknown[]) {
  return array
    .map((v) => {
      const val = escapeSQL(v, true);
      return Array.isArray(v) ? `(${val})` : val;
    })
    .join(', ');
}

function escapeBytes(val: Uint8Array) {
  // TODO: Replace with toHex() when it's available
  //
  // https://tc39.es/proposal-arraybuffer-base64/spec/#sec-uint8array.prototype.tohex
  // @ts-ignore
  return `X${val.map((v) => v.toString(16).padEnd(2, '0')).join('')}`;
}

function escapeObject(object: object) {
  let sql = '';

  for (const [key, val] of Object.entries(object)) {
    if (typeof val === 'function') {
      continue;
    }

    sql +=
      (sql.length === 0 ? '' : ', ') +
      escapeId(key) +
      ' = ' +
      escapeSQL(val, true);
  }

  return sql;
}

function escapeString(val: string) {
  return `'${val.replaceAll("'", "''")}'`;
}
