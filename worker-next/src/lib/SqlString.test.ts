// Tests adapted from https://github.com/mysqljs/sqlstring/blob/master/test/unit/test-SqlString.js
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { compose, escapeId, escapeSQL, raw } from './SqlString.ts';

describe('SqlString.escapeId', () => {
  it('value is quoted', () => {
    assert.equal(escapeId('id'), '`id`');
  });

  it('value can be a number', () => {
    assert.equal(escapeId(42), '`42`');
  });

  it('value can be an object', () => {
    assert.equal(escapeId({}), '`[object Object]`');
  });

  it('value toString is called', () => {
    assert.equal(
      escapeId({
        toString: () => {
          return 'foo';
        },
      }),
      '`foo`'
    );
  });

  it('value toString is quoted', () => {
    assert.equal(
      escapeId({
        toString: () => {
          return 'f`oo';
        },
      }),
      '`f``oo`'
    );
  });

  it('value containing escapes is quoted', () => {
    assert.equal(escapeId('i`d'), '`i``d`');
  });

  it('value containing separator is quoted', () => {
    assert.equal(escapeId('id1.id2'), '`id1`.`id2`');
  });

  it('value containing separator and escapes is quoted', () => {
    assert.equal(escapeId('id`1.i`d2'), '`id``1`.`i``d2`');
  });

  it('value containing separator is fully escaped when forbidQualified', () => {
    assert.equal(escapeId('id1.id2', true), '`id1.id2`');
  });

  it('arrays are turned into lists', () => {
    assert.equal(escapeId(['a', 'b', 't.c']), '`a`, `b`, `t`.`c`');
  });

  it('nested arrays are flattened', () => {
    assert.equal(escapeId(['a', ['b', ['t.c']]]), '`a`, `b`, `t`.`c`');
  });
});

describe('SqlString.escape', () => {
  it('undefined -> NULL', () => {
    assert.equal(escapeSQL(undefined), 'NULL');
  });

  it('null -> NULL', () => {
    assert.equal(escapeSQL(null), 'NULL');
  });

  it('booleans convert to strings', () => {
    assert.equal(escapeSQL(false), 'false');
    assert.equal(escapeSQL(true), 'true');
  });

  it('numbers convert to strings', () => {
    assert.equal(escapeSQL(5), '5');
  });

  it('raw not escaped', () => {
    assert.equal(escapeSQL(raw('NOW()')), 'NOW()');
  });

  it('objects are turned into key value pairs', () => {
    assert.equal(escapeSQL({ a: 'b', c: 'd' }), "`a` = 'b', `c` = 'd'");
  });

  it('Maps are turned into key value pairs', () => {
    assert.equal(
      escapeSQL(new Map(Object.entries({ a: 'b', c: 'd' }))),
      "`a` = 'b', `c` = 'd'"
    );
  });

  it('objects function properties are ignored', () => {
    assert.equal(escapeSQL({ a: 'b', c: () => {} }), "`a` = 'b'");
  });

  it('object values toSqlString is called', () => {
    assert.equal(
      escapeSQL({ id: { toSqlString: () => 'LAST_INSERT_ID()' } }),
      '`id` = LAST_INSERT_ID()'
    );
  });

  it('objects toSqlString is called', () => {
    assert.equal(escapeSQL({ toSqlString: () => '@foo_id' }), '@foo_id');
  });

  it('objects toSqlString is not quoted', () => {
    assert.equal(
      escapeSQL({ toSqlString: () => 'CURRENT_TIMESTAMP()' }),
      'CURRENT_TIMESTAMP()'
    );
  });

  it('nested objects are cast to strings', () => {
    assert.equal(escapeSQL({ a: { nested: true } }), "`a` = '[object Object]'");
  });

  it('nested objects use toString', () => {
    assert.equal(escapeSQL({ a: { toString: () => 'foo' } }), "`a` = 'foo'");
  });

  it('nested objects use toString is quoted', () => {
    assert.equal(escapeSQL({ a: { toString: () => "f'oo" } }), "`a` = 'f''oo'");
  });

  it('arrays are turned into lists', () => {
    assert.equal(escapeSQL([1, 2, 'c']), "1, 2, 'c'");
  });

  it('Sets are turned into lists', () => {
    assert.equal(escapeSQL(new Set([1, 2, 'c'])), "1, 2, 'c'");
  });

  it('nested arrays are turned into grouped lists', () => {
    assert.equal(
      escapeSQL([
        [1, 2, 3],
        [4, 5, 6],
        ['a', 'b', 'c'],
      ]),
      "(1, 2, 3), (4, 5, 6), ('a', 'b', 'c')"
    );
  });

  it('nested objects inside arrays are cast to strings', () => {
    assert.equal(
      escapeSQL([1, { nested: true }, 2]),
      "1, '[object Object]', 2"
    );
  });

  it('nested objects inside arrays use toString', () => {
    assert.equal(escapeSQL([1, { toString: () => 'foo' }, 2]), "1, 'foo', 2");
  });

  it('strings are quoted', () => {
    assert.equal(escapeSQL('Super'), "'Super'");
  });

  it('dates are converted to ISO8601', () => {
    const expected = '2012-05-07T18:42:03.002Z';
    const date = new Date(2012, 4, 7, 11, 42, 3, 2);
    const string = escapeSQL(date);

    assert.strictEqual(string, "'" + expected + "'");
  });

  it('invalid dates throw', () => {
    const date = new Date(Number.NaN);

    assert.throws(() => escapeSQL(date));
  });

  it('NaN -> NaN', () => {
    assert.equal(escapeSQL(Number.NaN), 'NaN');
  });

  it('Infinity -> Infinity', () => {
    assert.equal(escapeSQL(Number.POSITIVE_INFINITY), 'Infinity');
  });
});

describe('SqlString.format', () => {
  it('question marks are replaced with escaped array values', () => {
    const sql = compose('? and ?', ['a', 'b']);
    assert.equal(sql, "'a' and 'b'");
  });

  it('?# is supported', () => {
    const sql = compose('?1 and ?2', ['a', 'b']);
    assert.equal(sql, "'a' and 'b'");
  });

  it('double question marks are replaced with escaped id', () => {
    const sql = compose('SELECT * FROM ?? WHERE id = ?', ['table', 42]);
    assert.equal(sql, 'SELECT * FROM `table` WHERE id = 42');
  });

  it('triple question marks are ignored', () => {
    const sql = compose('? or ??? and ?', ['foo', 'bar', 'fizz', 'buzz']);
    assert.equal(sql, "'foo' or ??? and 'bar'");
  });

  it('insufficient vars throw', () => {
    assert.throws(() => compose('? and ?', ['a']));
  });

  it('extra arguments are not used', () => {
    const sql = compose('? and ?', ['a', 'b', 'c']);
    assert.equal(sql, "'a' and 'b'");
  });

  it('question marks within values do not cause issues', () => {
    const sql = compose('? and ?', ['hello?', 'b']);
    assert.equal(sql, "'hello?' and 'b'");
  });

  it('undefined is ignored', () => {
    const sql = compose('?', undefined, false);
    assert.equal(sql, '?');
  });

  it('objects is converted to values', () => {
    const sql = compose('?', { hello: 'world' }, false);
    assert.equal(sql, "`hello` = 'world'");
  });

  it('objects is not converted to values', () => {
    let sql = compose('?', { hello: 'world' }, true);
    assert.equal(sql, "'[object Object]'");

    sql = compose('?', { toString: () => 'hello' }, true);
    assert.equal(sql, "'hello'");

    sql = compose('?', { toSqlString: () => '@foo' }, true);
    assert.equal(sql, '@foo');
  });

  it('sql is untouched if no values are provided', () => {
    const sql = compose('SELECT ??');
    assert.equal(sql, 'SELECT ??');
  });

  it('sql is untouched if values are provided but there are no placeholders', () => {
    const sql = compose('SELECT COUNT(*) FROM table', ['a', 'b']);
    assert.equal(sql, 'SELECT COUNT(*) FROM table');
  });
});

describe('SqlString.raw', () => {
  it('creates object', () => {
    assert.equal(typeof raw('NOW()'), 'object');
  });

  it('rejects number', () => {
    assert.throws(() => {
      raw(42);
    });
  });

  it('rejects undefined', () => {
    assert.throws(() => {
      raw(undefined);
    });
  });

  it('object has toSqlString', () => {
    assert.equal(typeof raw('NOW()').toSqlString, 'function');
  });

  it('toSqlString returns sql as-is', () => {
    assert.equal(
      raw("NOW() AS 'current_time'").toSqlString(),
      "NOW() AS 'current_time'"
    );
  });
});
