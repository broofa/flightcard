#!/usr/bin/env node

/**
 * This script fetches the TRA members list from the TRA website.  This used to
 * be fairly straight-forward, however TRA recently moved the members list
 * behind a login page. So now we have to use puppeteer to login and fetch the
 * members list.
 *
 * The script uses the following environment variables: TRA_USERNAME: The
 * username to login to the TRA website. TRA_PASSWORD: The password to login to
 * the TRA website. FC_API_KEY: The API key set in the cloudflare worker.
 */

import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const { FC_API_KEY, TRA_USERNAME, TRA_PASSWORD } = process.env;

if (!FC_API_KEY || !TRA_USERNAME || !TRA_PASSWORD) {
  console.error('Missing required env vars');
  process.exit(1);
}

const isProduction = process.argv.includes('--production');

// TODO: Need to read this from env var
const MEMBER_API_ENDPOINT = isProduction
  ? 'https://club-members.robert4852.workers.dev'
  : 'http://localhost:6543';

console.log('isProduction:', isProduction);
console.log('MEMBER_API_ENDPOINT:', MEMBER_API_ENDPOINT);
console.log('-----------------------------------');

// See "Member Certification List(csv)" at
// https://www.tripoli.org/content.aspx?page_id=22&club_id=795696&module_id=468541
const TRA_LOGIN_PAGE = 'https://tripoli.org/login';
const TRA_MEMBERS_PATH = '/docs.ashx?id=916333';

const CACHE_PATH = '/tmp/tra_members.csv';

const FC_TRA_ENDPOINT = `${MEMBER_API_ENDPOINT}/members`;

async function traScrape() {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: true,
    // args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // open a new blank page
    const page = await browser.newPage();

    // Navigate the page to a URL.
    console.log('Logging in');
    await page.goto(TRA_LOGIN_PAGE, { timeout: 5000 });

    // Type into search box.
    await page.locator('#ctl00_ctl00_login_name').fill(TRA_USERNAME);
    await page.locator('#ctl00_ctl00_password').fill(TRA_PASSWORD);

    // Wait and click on first result.
    await page.locator('#ctl00_ctl00_login_button').click();

    console.log('Waiting for navigation');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });

    console.log('Fetching list');
    // Note: page.evaluate() runs the function in a different context, so it
    // doesn't have access to any closure state.  The only way to pass data to
    // it is by passing it as an argument. And the only way to get data back
    // from it is by returning it.
    const membersCSV = await page.evaluate(async (url) => {
      const res = await fetch(url);
      return res.text();
    }, TRA_MEMBERS_PATH);

    return membersCSV;
  } finally {
    await browser.close();
  }
}

/**
 * @param {string} membersCSV
 */
async function traPost(membersCSV) {
  var body = JSON.stringify(
    { key: FC_API_KEY, membersCSV: membersCSV },
    null,
    2
  );
  var headers = {};
  const res = await fetch(FC_TRA_ENDPOINT, { method: 'POST', headers, body });
  if (!res.ok) {
    console.error(
      `Post to FlightCard worker failed: ${res.status} ${res.statusText}`
    );
  }
}

async function readCache() {
  return fs.readFile(CACHE_PATH, 'utf8').catch(() => undefined);
}

/**
 * @param {string} membersCSV
 */
function writeCache(membersCSV) {
  return fs.writeFile(CACHE_PATH, membersCSV);
}

async function main() {
  /** @type {string} */
  let membersCSV;

  /** @type {TRACache} */
  if (!isProduction) {
    membersCSV = await readCache();

    if (membersCSV) {
      console.log('🏇 Using cached members list 🏇');
    }
  }

  if (!membersCSV) {
    console.time('traScrape()');
    membersCSV = await traScrape();
    console.timeEnd('traScrape()');
  }

  if (!membersCSV) {
    console.error('Failed to fetch members list');
    process.exit(1);
  }

  if (!isProduction) {
    await writeCache(membersCSV);
  }

  console.time('traPost()');
  await traPost(membersCSV);
  console.timeEnd('traPost()');
}

try {
  await main();
  console.log('-- Fin --');
} catch (err) {
  console.error(err);
  process.exit(1);
}
