import { compose, escapeId } from './SqlString';

type CallableQuery = Pick<
  CFQuery,
  'toString' | 'toSqlString' | 'run' | 'first'
>;

/**
 * A lightweight query builder for (CloudFlare D1) SQLite DBs
 */
export class CFQuery {
  parts: string[] = [];
  vars: unknown[] = [];

  _var(value: unknown = null) {
    if (typeof value === 'function') {
      const q = new CFQuery();
      q.vars = this.vars;
      value(q);
      return `( ${q.toString()} )`;
    }

    this.vars.push(value);
    return `?${this.vars.length}`;
  }

  /**
   * SELECT
   */
  select(...fields: string[]): CallableQuery & Pick<CFQuery, 'from' | 'where'> {
    this.parts.push(`SELECT ${fields.join(', ')}`);
    return this;
  }

  /**
   * INSERT
   */
  insertInto(table: string): CallableQuery & Pick<CFQuery, 'values'> {
    this.parts.push(`INSERT INTO ${table}`);
    return this;
  }

  /**
   * UPDATE
   */
  update(table: string): CallableQuery & Pick<CFQuery, 'set'> {
    this.parts.push(`UPDATE ${table}`);
    return this;
  }

  /**
   * DELETE
   */
  delete(table: string): CallableQuery & Pick<CFQuery, 'where'> {
    this.parts.push(`DELETE FROM ${table}`);
    return this;
  }

  /**
   * ON CONFLICT DO
   */
  onConflictDo(
    field: string,
    action: 'UPDATE' | 'NOTHING' = 'UPDATE'
  ): CallableQuery & Pick<CFQuery, 'set'> {
    this.parts.push(`ON CONFLICT (${field}) DO ${action}`);
    return this;
  }

  /**
   * FROM
   */
  from(table: string): CallableQuery & Pick<CFQuery, 'where' | 'onConflictDo'> {
    this.parts.push(`FROM ${table}`);
    return this;
  }

  /**
   * SET
   */
  set<T extends object>(
    row: T,
    operator: '=' | 'VALUES' = '='
  ): CallableQuery & ReturnType<CFQuery['from']> {
    const { columns, values } = this.#prepareValues([row]);

    this.parts.push(`SET (${columns.join(', ')}) = ${this._var(values)}`);
    return this;
  }

  /**
   * VALUES
   */
  values<T extends object>(
    rows: T | T[]
  ): CallableQuery & ReturnType<CFQuery['from']> {
    const { columns, values } = this.#prepareValues(
      Array.isArray(rows) ? rows : [rows]
    );
    this.parts.push(`(${columns.join(', ')}) VALUES ${this._var(values)}`);
    return this;
  }

  #prepareValues<T extends object>(rows: T | T[]) {
    if (!Array.isArray(rows)) {
      rows = [rows];
    }

    const columns = Object.keys(rows[0]) as (keyof T)[];
    const values = rows.map((row) => columns.map((k) => row[k]));

    return { columns: columns.map((c) => escapeId(c)), values };
  }

  /**
   * WHERE
   */
  where(
    key: string,
    ...values: unknown[]
  ): CallableQuery & Pick<CFQuery, 'and' | 'or' | 'onConflictDo'> {
    return this.#clause('WHERE', key, ...values);
  }

  and(key: string, ...values: unknown[]): ReturnType<CFQuery['where']> {
    return this.#clause('AND', key, ...values);
  }

  or(key: string, ...values: unknown[]): ReturnType<CFQuery['where']> {
    return this.#clause('OR', key, ...values);
  }

  #clause(type: 'WHERE' | 'AND' | 'OR', key: string, ...values: unknown[]) {
    let i = 0;
    const clause = key.replaceAll('?', () => this._var(values[i++]));
    if (i !== values.length) {
      throw new Error('token <-> value mismatch');
    }
    this.parts.push(`${type} ${clause}`);
    return this;
  }

  toString() {
    return this.parts.join(' ');
  }

  // Stringify for SqlString
  toSqlString() {
    return compose(this.toString(), this.vars);
  }

  toStatement(env: Env) {
    return env.AppDB.prepare(this.toSqlString());
  }

  async run(env: Env) {
    try {
      return await this.toStatement(env).run();
    } catch (err) {
      throw new QueryError(this, err as Error);
    }
  }

  async first<T>(env: Env) {
    try {
      return await this.toStatement(env).first<T>();
    } catch (err) {
      throw new QueryError(this, err as Error);
    }
  }
}

class QueryError extends Error {
  constructor(
    public query: CFQuery,
    cause: Error
  ) {
    super(cause.message, { cause });
  }
}
