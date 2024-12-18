/**
 * A lightweight query builder for (CloudFlare D1) SQLite DBs
 */
export class CFQuery {
  parts: string[] = [];
  params: unknown[] = [];

  _param(value: unknown) {
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
      throw new Error('Cannot use object as parameter');
    }
    this.params.push(value);
    return `?${this.params.length}`;
  }

  /**
   * SELECT
   */
  select(...fields: string[]) {
    this.parts.push(`SELECT ${fields.join(', ')}`);
    return this;
  }

  /**
   * INSERT
   */
  insertInto(table: string) {
    this.parts.push(`INSERT INTO ${table}`);
    return this;
  }

  /**
   * UPDATE
   */
  update(table: string) {
    this.parts.push(`UPDATE ${table}`);
    return this;
  }

  /**
   * DELETE
   */
  delete(table: string) {
    this.parts.push(`DELETE FROM ${table}`);
    return this;
  }

  /**
   * ON CONFLICT DO
   */
  onConflictDo(field: string, action: 'UPDATE' | 'NOTHING' = 'UPDATE') {
    this.parts.push(`ON CONFLICT (${field}) DO ${action}`);
    return this;
  }

  /**
   * FROM
   */
  from(table: string) {
    this.parts.push(`FROM ${table}`);
    return this;
  }

  /**
   * SET
   */
  set(fields: Record<string, unknown>, operator: '=' | 'VALUES' = '=') {
    const { names, indexes } = this.#setvalues(fields);

    this.parts.push(`SET (${names.join(', ')}) = (${indexes.join(', ')})`);
    return this;
  }

  /**
   * VALUES
   */
  values(fields: Record<string, unknown>) {
    const { names, indexes } = this.#setvalues(fields);

    this.parts.push(`(${names.join(', ')}) VALUES (${indexes.join(', ')})`);
    return this;
  }

  #setvalues(fields: Record<string, unknown>) {
    const names = [],
      indexes = [];
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined) {
        continue;
      }

      names.push(k);
      indexes.push(this._param(v));
    }

    return { names, indexes };
  }

  /**
   * WHERE
   */
  where(key: string, ...values: unknown[]) {
    return this.#clause('WHERE', key, ...values);
  }

  and(key: string, ...values: unknown[]) {
    return this.#clause('AND', key, ...values);
  }

  or(key: string, ...values: unknown[]) {
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
    console.log('QUERY:', this.toString(), this.params);

    const statement = env.AppDB.prepare(this.toString());
    return this.params.length ? statement.bind(...this.params) : statement;
  }

  run(env: Env) {
    return this.toStatement(env).run();
  }

  first<T>(env: Env) {
    return this.toStatement(env).first<T>();
  }
}
