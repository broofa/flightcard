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
  for (let model of models) {
    model = { ...model };
    delete model._type;

    const query = new CFQuery().insertInto(tableName).values(model);
    const result = await query.run(env);
    results.push(result);
  }

  return results.length;
}

export async function GetAdminMocks(req: RouteRequest, env: Env) {
  await deleteMocks(env);

  const mocks = getMockModels();

  const saved: Record<string, unknown> = {};

  // Order matters here!
  for (const { tableName, primaryKey } of TABLES) {
    saved[tableName] = await saveMocks(env, mocks, tableName, primaryKey);
  }

  return Response.json(saved);
}
