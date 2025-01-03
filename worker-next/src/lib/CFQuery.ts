/**
 * A lightweight query builder for (CloudFlare D1) SQLite DBs
 */
export class CFQuery {
  parts: string[] = [];
  params: unknown[] = [];

  _param(value: unknown = null) {
    if (typeof value === 'function') {
      const q = new CFQuery();
      q.params = this.params;
      value(q);
      return `( ${q.toString()} )`;
    }

    if (value instanceof CFQuery) {
      return `( ${value.toString()} )`;
    }

    if (value && typeof value === 'object') {
      if (value.constructor === Object) {
        // If vanilla object, convert to JSON
        value = JSON.stringify(value);
      } else {
        throw new Error('Unexpected parameter type');
      }
    }

    this.params.push(value);
    return `?${this.params.length}`;
  }

  /**
   * SELECT
   */
  select(...fields: string[]): Pick<CFQuery, 'from' | 'where'> {
    this.parts.push(`SELECT ${fields.join(', ')}`);
    return this;
  }

  /**
   * INSERT
   */
  insertInto(table: string): Pick<CFQuery, 'values'> {
    this.parts.push(`INSERT INTO ${table}`);
    return this;
  }

  /**
   * UPDATE
   */
  update(table: string): Pick<CFQuery, 'set'> {
    this.parts.push(`UPDATE ${table}`);
    return this;
  }

  /**
   * DELETE
   */
  delete(table: string): Pick<CFQuery, 'where' | 'run' | 'first'> {
    this.parts.push(`DELETE FROM ${table}`);
    return this;
  }

  /**
   * ON CONFLICT DO
   */
  onConflictDo(
    field: string,
    action: 'UPDATE' | 'NOTHING' = 'UPDATE'
  ): Pick<CFQuery, 'set' | 'run' | 'first'> {
    this.parts.push(`ON CONFLICT (${field}) DO ${action}`);
    return this;
  }

  /**
   * FROM
   */
  from(
    table: string
  ): Pick<CFQuery, 'where' | 'onConflictDo' | 'run' | 'first'> {
    this.parts.push(`FROM ${table}`);
    return this;
  }

  /**
   * SET
   */
  set<T extends object>(
    row: T,
    operator: '=' | 'VALUES' = '='
  ): ReturnType<CFQuery['from']> {
    const { columns, valueGroups } = this.#setValues([row]);

    this.parts.push(`SET (${columns.join(', ')}) = ${valueGroups.join(', ')}`);
    return this;
  }

  /**
   * VALUES
   */
  values<T extends object>(rows: T | T[]): ReturnType<CFQuery['from']> {
    const { columns, valueGroups } = this.#setValues(
      Array.isArray(rows) ? rows : [rows]
    );

    this.parts.push(`(${columns.join(', ')}) VALUES ${valueGroups.join(', ')}`);
    return this;
  }

  #setValues<T extends object>(rows: T[]) {
    const columns = Object.keys(rows[0]) as (keyof T)[];

    // Gather all columns
    const valueGroups = rows.map((row) => {
      const indexes = columns.map((k) => this._param(row[k]));
      return `(${indexes.join(', ')})`;
    });

    return { columns: columns.map((c) => `"${c as string}"`), valueGroups };
  }

  /**
   * WHERE
   */
  where(
    key: string,
    ...values: unknown[]
  ): Pick<CFQuery, 'and' | 'or' | 'onConflictDo' | 'run' | 'first'> {
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
    const clause = key.replaceAll('?', () => this._param(values[i++]));
    if (i !== values.length) {
      throw new Error('token <-> value mismatch');
    }
    this.parts.push(`${type} ${clause}`);
    return this;
  }

  toString() {
    return this.parts.join(' ');
  }

  toStatement(env: Env) {
    // console.log('QUERY:', this.toString(), this.params);

    const statement = env.AppDB.prepare(this.toString());
    return this.params.length ? statement.bind(...this.params) : statement;
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
