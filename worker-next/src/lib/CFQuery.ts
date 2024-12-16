export class CFQuery {
  parts: string[] = [];
  params: unknown[] = [];

  _param(value: unknown) {
    if (value instanceof CFQuery) {
      return `(${value.toString()})`;
    }

    if (value && typeof value === 'object') {
      throw new Error('Cannot use object as parameter');
    }
    this.params.push(value);
    return `?${this.params.length}`;
  }

  /**
   * Creates a new CFQuery object, but one that shares params with the target
   * query
   */
  subquery() {
    const subquery = new CFQuery();
    subquery.params = this.params;
    return subquery;
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
  insert(table: string) {
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
   * ON CONFLICT
   */
  onConflict(field: string, action: 'UPDATE' | 'NOTHING' = 'UPDATE') {
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
    const names = [],
      indexes = [];
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined) {
        continue;
      }

      names.push(k);
      indexes.push(this._param(v));
    }

    this.parts.push(
      operator === '='
        ? `SET (${names.join(', ')}) = (${indexes.join(', ')})`
        : `(${names.join(', ')}) VALUES (${indexes.join(', ')})`
    );
    return this;
  }

  /**
   * VALUES
   */
  values(fields: Record<string, unknown>) {
    return this.set(fields, 'VALUES');
  }

  /**
   * WHERE
   */
  where(key: string, value: unknown) {
    this.parts.push(`WHERE ${key} = ${this._param(value)}`);
    return this;
  }

  /**
   *
   */
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
