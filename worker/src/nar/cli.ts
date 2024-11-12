#!/usr/bin/env npx tsx

import type { NeonPagination } from '@flightcard/common-types';
import NARAPI from './NARAPI';
import { scanInit, scanIsComplete, scanReset } from './scan';

const [command] = process.argv.slice(2);

const { NAR_API_ORG = '', NAR_API_KEY = '' } = process.env;
const nar = new NARAPI(NAR_API_ORG, NAR_API_KEY);

function usage() {
  console.log('Usage: ./cli.ts [command]');
  console.log('... where [command] is one of:');
  console.log('  outputFields');
  console.log('  searchFields');
  console.log('  fetch');
}

async function main() {
  switch (command) {
    case 'outputFields':
      await nar.listOutputFields();
      break;

    case 'searchFields':
      await nar.listSearchFields();
      break;

    case 'fetch': {
      // Mimic the scan loop implemented in the worker's scheduled event handler
      const scan = scanInit();
      scan.pagination = {
        currentPage: 351,
      } as NeonPagination;

      while (true) {
        const page = await nar.fetchMembers(scan);
        console.log('Results:', page.searchResults.length);
        console.log('Scan state:', scan);
        console.log('Scan complete:', scanIsComplete(scan));

        if (scanIsComplete(scan)) {
          scanReset(scan);
        }
      }

      break;
    }

    default:
      usage();
      break;
  }
}

main();
