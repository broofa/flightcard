#!/usr/bin/env npx tsx

import NarAPI, {
  createScanState,
  scanComplete,
  updateScanState,
} from './NarAPI';

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
      const scanState = createScanState();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        console.log('SCANSTATE', scanState);
        const page = await narAPI.fetchMembers(scanState);
        updateScanState(scanState, page);
        if (scanComplete(page.pagination)) {
          break;
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
