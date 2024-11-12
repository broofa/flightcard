import { traUpdate } from '../lib/tra-util';

export default async function (request: Request, env: Env) {
  const { pathname } = new URL(request.url);
  if (pathname !== '/members' || request.method !== 'POST') {
    return;
  }

  const data: { key: string; membersCSV: string } = await request.json();

  if (!data.key || data.key !== env.FC_API_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('Received ', data.membersCSV.length, 'bytes of data');

  await traUpdate(data.membersCSV, env);

  return new Response('OK');
}
