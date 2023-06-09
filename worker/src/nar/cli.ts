#!/usr/bin/env npx tsx

import NarAPI, {
  initScanState,
  isScanComplete,
  updateScanFields,
} from './NarAPI';
import { NeonPagination } from './nar_types';

const [command] = process.argv.slice(2);

const { NAR_API_ORG = '', NAR_API_KEY = '' } = process.env;
const narAPI = new NarAPI(NAR_API_ORG, NAR_API_KEY);

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
      await narAPI.listOutputFields();
      break;

    case 'searchFields':
      await narAPI.listSearchFields();
      break;

    // This mimics what we do to sync the NAR database in the worker's scheduled
    // event.  Hence, why there's as little code here as possible (since
    // anything here would just have to be copy/pasted into the scheduled()
    // event handler).
    case 'fetch': {
      const scanState = initScanState();
      scanState.pagination = {
        currentPage: 351,
      } as NeonPagination;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const page = await narAPI.fetchMembers(scanState);
        console.log('Results:', page.searchResults.length);
        console.log('Scan state:', scanState);
        console.log('Scan complete:', isScanComplete(scanState));

        if (isScanComplete(scanState)) {
          updateScanFields(scanState);
        }
      }
    }

    default:
      usage();
      break;
  }
}

main();
