/**
 * Coudflare worker for fetching, parsing, and caching the list of Tripoli
 * members available at MEMBERS_URL (below).
 */

const MEMBERS_URL = 'https://tripoli.org/docs.ashx?id=916333';
const BUCKET_SIZE = 1000;
const DOMAIN_WHITELIST = /localhost$|flightcard.org$/;

class HTTPError {
  constructor(message, statusCode = 500) {
    this.message = message;
    this.statusCode = statusCode;
  }
}

// Handle API requests.
addEventListener('fetch', event => {
  const { request } = event;

  // Compose response headers.  We use CORS to restrict use to development and
  // production environments
  const origin = request.headers.get('origin');
  const hostname = origin ? new URL(origin).hostname : null;
  const allowOrigin = DOMAIN_WHITELIST.test(hostname) ? origin : '';
  const headers = {
    'content-type': 'application/json',
    'access-control-allow-origin': allowOrigin,
  };

  // Invoke handler.  We wrap this in some basic boilerplate to insure we
  // _always_ return a JSON response, and to make error handling simple and
  // robust.
  try {
    const body = handleRequest(request);
    const response = new Response(JSON.stringify(body, null, 2), { headers });
    event.respondWith(handleRequest(response));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.messsage }), {
      status: err.statusCode ?? 500,
      headers,
    });
  }
});

// Respond to scheduled events.  These are configured in the Cloudflare console
// where.  As of thiw writing,  it's set to fire daily at 1am UTC.
addEventListener('scheduled', event => {
  event.waitUntil(updateMembersKV());
});

// fetch the members list from the source and parse it
async function fetchMembers() {
  const resp = await fetch(MEMBERS_URL);
  const csv = await resp.text();

  // Map lines => member structs
  const lines = csv.split('\n');
  const members = lines.map(line => {
    // TODO: This'll break if there are commas in the field values
    const fields = line.match(/"[^"]+"/g);

    if (!fields) return;

    // Remove quotes
    let [id, name, level, expires] = fields.map(v => v.replaceAll('"', ''));

    // Headers rows don't have parsable id values
    if (!/^\d+$/.test(id)) return;

    const [lastName, firstName] = name.split(/,\s*/g);

    id = parseInt(id);
    level = parseInt(level);
    expires = Date.parse(expires);
    return { id, firstName, lastName, level, expires };
  });

  return members.filter(v => v);
}

async function updateMembersKV() {
  const members = await fetchMembers();
  const groups = {};
  const promises = [];

  // Record the last update time (attempt)
  await TRIPOLI_MEMBERS.put('lastUpdate', JSON.stringify(Date.now()));

  // Group members into buckets
  for (const member of members) {
    const { id } = member;
    const key = Math.floor(id / BUCKET_SIZE);
    if (!groups[key]) groups[key] = {};
    groups[key][id] = member;
  }

  // Save each bucket into KV
  //
  //  NOTE: CF limits free plan to 1,000 writes per day, which is why we do this in buckets
  await Promise.allSettled(
    Object.entries(groups).map(([k, v]) => {
      return TRIPOLI_MEMBERS.put(String(k), JSON.stringify(v));
    })
  );
}

async function handleRequest(request) {
  const { searchParams } = new URL(request.url);
  let id = parseInt(searchParams.get('id') ?? 1);

  const origin = request.headers.get('origin');
  const hostname = origin ? new URL(origin).hostname : null;

  const allowOrigin = /localhost$|flightcard.org$/.test(hostname) ? origin : '';

  const headers = {
    'content-type': 'application/json',
    'access-control-allow-origin': allowOrigin,
  };

  const memberBucket = await TRIPOLI_MEMBERS.get(Math.floor(id / BUCKET_SIZE), {
    type: 'json',
  });
  const member = memberBucket?.[id];

  if (!member) {
    return new Response(JSON.stringify({ error: 'Member not found' }), {
      status: 404,
      headers,
    });
  }

  return new Response(JSON.stringify(member, null, 2), { headers });
}
