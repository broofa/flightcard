import { compose, escapeId } from './SqlString';

type BaseOps = 'toString' | 'toSqlString' | 'run' | 'first';

/**
 * A lightweight query builder for (CloudFlare D1) SQLite DBs
 */
export class CFQuery<ResultType = unknown> {
  #parts: string[] = [];
  #vars: unknown[] = [];

  #var(val: unknown = null) {
    if (typeof val === 'function') {
      const q = new CFQuery();
      q.#vars = this.#vars;
      val(q);
      return `( ${q.toString()} )`;
    }

    this.#vars.push(val);
    return `?${this.#vars.length}`;
  }

  /**
   * SELECT
   */
  select(
    ...fields: string[]
  ): Pick<CFQuery<ResultType>, BaseOps | 'from' | 'where'> {
    this.#parts.push(`SELECT ${fields.join(', ')}`);
    return this;
  }

  /**
   * INSERT
   */
  insertInto(table: string): Pick<CFQuery<ResultType>, BaseOps | 'values'> {
    this.#parts.push(`INSERT INTO ${table}`);
    return this;
  }

  /**
   * UPDATE
   */
  update(table: string): Pick<CFQuery<ResultType>, BaseOps | 'set'> {
    this.#parts.push(`UPDATE ${table}`);
    return this;
  }

  /**
   * DELETE
   */
  delete(table: string): Pick<CFQuery<ResultType>, BaseOps | 'where'> {
    this.#parts.push(`DELETE FROM ${table}`);
    return this;
  }

  /**
   * ON CONFLICT DO
   */
  onConflictDo(
    field: string,
    action: 'UPDATE' | 'NOTHING' = 'UPDATE'
  ): Pick<CFQuery<ResultType>, BaseOps | 'set'> {
    this.#parts.push(`ON CONFLICT (${field}) DO ${action}`);
    return this;
  }

  /**
   * FROM
   */
  from(
    table: string
  ): Pick<CFQuery<ResultType>, BaseOps | 'where' | 'onConflictDo' | 'join'> {
    this.#parts.push(`FROM ${table}`);
    return this;
  }

  /**
   * SET
   */
  set<T extends object>(
    row: T,
    operator: '=' | 'VALUES' = '='
  ): Pick<CFQuery, BaseOps | 'from' | 'where'> {
    const { columns, values } = this.#prepareValues([row]);

    this.#parts.push(`SET (${columns.join(', ')}) = ${this.#var(values)}`);
    return this;
  }

  /**
   * VALUES
   */
  values<T extends object>(rows: T | T[]): ReturnType<CFQuery['from']> {
    const { columns, values } = this.#prepareValues(
      Array.isArray(rows) ? rows : [rows]
    );
    this.#parts.push(`(${columns.join(', ')}) VALUES ${this.#var(values)}`);
    return this;
  }

  #prepareValues<T extends object>(rows: T | T[]) {
    if (!Array.isArray(rows)) {
      rows = [rows];
    }

    const columns = Object.keys(rows[0]) as (keyof T)[];
    const values = rows.map((row) =>
      columns.map((k) => {
        const val = row[k];
        if (val?.constructor === Object) {
          return JSON.stringify(val);
        }
        return val;
      })
    );

    return { columns: columns.map((c) => escapeId(c)), values };
  }

  /**
   * WHERE
   */
  where(
    key: string,
    ...values: unknown[]
  ): Pick<CFQuery<ResultType>, BaseOps | 'and' | 'or' | 'onConflictDo'> {
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
    const clause = key.replaceAll('?', () => this.#var(values[i++]));
    if (i !== values.length) {
      throw new Error('token <-> value mismatch');
    }
    this.#parts.push(`${type} ${clause}`);
    return this;
  }

  join(table: string): Pick<CFQuery<ResultType>, BaseOps | 'on' | 'using'> {
    this.#parts.push(`JOIN ${table}`);
    return this;
  }

  using(column: string): Pick<CFQuery<ResultType>, 'join' | 'where'> {
    this.#parts.push(`USING (${column})`);
    return this;
  }

  on(expr: string): Pick<CFQuery<ResultType>, 'join' | 'where'> {
    this.#parts.push(`ON ${expr}`);
    return this;
  }

  toString() {
    return this.#parts.join(' ');
  }

  // Stringify for SqlString
  toSqlString() {
    return compose(this.toString(), this.#vars);
  }

  toStatement(env: Env) {
    return env.AppDB.prepare(this.toSqlString());
  }

  async run(env: Env) {
    let q = this.toSqlString();

    if (q.length > 120) {
      q = q.slice(0, 120) + `... (${q.length - 160} more)`;
    }

    // make all-cap words yellow
    q = q.replace(/(\b[A-Z]+\b)/g, '\x1b[33m$1\x1b[0m');
    console.log('query: ' + q);
    try {
      return await this.toStatement(env).run<ResultType>();
    } catch (err) {
      throw new QueryError(this, err as Error);
    }
  }

  async first(env: Env) {
    try {
      return await this.toStatement(env).first<ResultType>();
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
