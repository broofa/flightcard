#!/usr/bin/env npx tsx

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CFDatabaseClient } from './src/CFDatabaseClient';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, FC_APP_DB } = process.env;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !FC_APP_DB) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const db = new CFDatabaseClient(
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN,
  FC_APP_DB
);

// Read migrations file
const dbFile = path.join(process.cwd(), process.argv[2]);
const sql = await fs.readFile(dbFile, 'utf-8');

const results = await db.query(sql);

console.log('OK');
