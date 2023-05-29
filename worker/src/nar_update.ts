import { CertOrg, iCert, NARCacheInfo } from './cert_types';
import { getCacheInfo, putCacheInfo, putCerts } from './kv_utils';
import NarAPI from './NarAPI';

declare const process: {
  env: {
    NAR_API_KEY: string;
    NAR_API_ORG: string;
  };
};

const MAX_FETCHERS = 5;

const { NAR_API_KEY, NAR_API_ORG } = process.env;

const NAR = new NarAPI(NAR_API_ORG, NAR_API_KEY);

type NARPage = {
  pagination: {
    currentPage: number;
    pageSize: number;
    sortColumn: string;
    sortDirection: string;
    totalPages: number;
    totalResults: number;
  };

  searchResults: {
    'NAR#': string;
    'Account ID': string;
    'Account Last Modified Date/Time': string;
    'First Name': string;
    'Membership Expiration Date': string;
    HPR: string;
    'Last Name': string;
  }[];
};

async function fetchNARPage(
  currentPage: number,
  lastModified: number
): Promise<NARPage> {
  const modifiedDate = new Date(lastModified).toISOString().split('T')[0];

  return (await NAR.accountQuery({
    body: JSON.stringify({
      searchFields: [
        {
          // NOTE: Only the date matters here.  Time-of-day is ignored(!)
          field: 'Account Last Modified Date',
          operator: 'GREATER_AND_EQUAL',
          value: modifiedDate,
        },
      ],

      outputFields: [
        'Account ID',
        'Membership Expiration Date',
        'Account Last Modified Date/Time',
        'First Name',
        'Last Name',
        43, // HPR
        44, // NAR#
      ],

      // `sortColumn` must be one of the `outputFields`
      pagination: {
        currentPage,
        pageSize: 200,
        sortColumn: 'Account Last Modified Date/Time',
        sortDirection: 'ASC',
      },
    }),
  })) as NARPage;
}

let mostRecentModifiedAt = 0;
let currentPage = 0;

async function processNextPage(page: NARPage) {
  for (const result of page.searchResults) {
    const {
      'NAR#': memberIdString,
      // "EXPIRATION": expires,
      // 'Account ID': accountId,
      'Account Last Modified Date/Time': modifiedAt,
      'First Name': firstName,
      'Membership Expiration Date': expiresString,
      HPR: levelString,
      'Last Name': lastName,
    } = result;

    const memberId = parseInt(memberIdString, 10);
    const modified = Date.parse(modifiedAt);
    const level = parseInt(levelString, 10);
    const expires = Date.parse(expiresString);

    if (!memberId || memberId > 1e6) continue;

    if (!isNaN(modified) && modified > mostRecentModifiedAt) {
      mostRecentModifiedAt = modified;
    }

    const cert: iCert = {
      memberId,
      firstName,
      lastName,
      level: isNaN(level) ? 0 : level,
      expires: isNaN(expires) ? 0 : expires,
      organization: CertOrg.NAR,
    };

    certs.push(cert);
  }
}

const certs: iCert[] = [];
async function fetcher(lastModified: number, previousPage?: NARPage) {
  if (!previousPage) {
    console.log(`Fetching page ${currentPage}`);
  } else {
    console.log(
      `Fetching ${currentPage} of ${previousPage.pagination.totalPages} pages`
    );
  }
  // eslint-disable-next-line no-constant-condition
  const page = await fetchNARPage(currentPage++, lastModified);
  console.log(page.searchResults.length, 'results');
  await processNextPage(page);

  // Stop if there's no results left
  if (page.searchResults.length === 0) return;
  if (currentPage >= page.pagination.totalPages) return;

  if (currentPage < Math.min(page.pagination.totalPages - 1, MAX_FETCHERS)) {
    // If there's more pages, spin up an extra fetcher (up to MAX_FETCHERS)
    console.log('(adding fetcher)');
    await Promise.allSettled([
      fetcher(lastModified, page),
      fetcher(lastModified, page),
    ]);
  } else {
    await fetcher(lastModified, page);
  }
}

async function main() {
  const cacheInfo = await getCacheInfo<NARCacheInfo>(CertOrg.NAR);
  mostRecentModifiedAt =
    cacheInfo?.mostRecentModifiedAt ?? Date.parse('2022-10-05');

  const lastModified = mostRecentModifiedAt;

  // Fetch results in parallel
  await Promise.allSettled([fetcher(lastModified)]);
  console.log('CERTS', certs);
  await putCerts(CertOrg.NAR, certs);

  await putCacheInfo<NARCacheInfo>(CertOrg.NAR, {
    updatedAt: Date.now(),
    mostRecentModifiedAt,
  });

  console.log('-- Fin --');
}

main();
