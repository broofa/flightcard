import type { BaseModel } from '@flightcard/models';
import { getMockModels } from '../../migrations/mock-gen';
import { CFQuery } from '../lib/CFQuery';
import type { RouteRequest } from '../lib/CloudflareRouter';

type MocksKey = keyof ReturnType<typeof getMockModels>;

// Order here indicates creation (reverse-deletion) order needed to prevent FK
// violations
const TABLES: {
  tableName: MocksKey;
  primaryKey: string;
}[] = [
  { tableName: 'users', primaryKey: 'userID' },
  { tableName: 'certs', primaryKey: 'certID' },
  { tableName: 'launches', primaryKey: 'launchID' },
  { tableName: 'pads', primaryKey: 'padID' },
  { tableName: 'rockets', primaryKey: 'rocketID' },
  { tableName: 'attendees', primaryKey: 'attendeeID' },
  { tableName: 'flights', primaryKey: 'flightID' },
  { tableName: 'motors', primaryKey: 'motorID' },
];

async function deleteMocks(env: Env) {
  for (const { tableName, primaryKey } of [...TABLES].reverse()) {
    const query = new CFQuery()
      .delete(tableName)
      .where(`${primaryKey} LIKE ?`, 'mock-%');

    await query.run(env);
  }
}

async function saveMocks<T extends BaseModel>(
  env: Env,
  mocks: ReturnType<typeof getMockModels>,
  tableName: MocksKey,
  keyName: string
) {
  const results = [];
  const models = mocks[tableName];
  const values = models.map((model) => {
    model = { ...model };
    delete model._type;
    return model;
  });

  const query = new CFQuery().insertInto(tableName).values(values);
  return {
    ...(await query.run(env)),
    query: query.toSqlString(),
    queryLength: query.toSqlString().length,
  };
}

export async function GetAdminMocks(req: RouteRequest, env: Env) {
  await deleteMocks(env);

  const mocks = getMockModels();

  const results: Record<string, unknown> = {};

  for (const { tableName, primaryKey } of TABLES) {
    results[tableName] = await saveMocks(env, mocks, tableName, primaryKey);
  }

  return Response.json(results);
}
