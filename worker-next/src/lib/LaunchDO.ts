import { DurableObject } from 'cloudflare:workers';

export class LaunchDO extends DurableObject {
  clients = new Set<WebSocket>();

  async fetch(req: Request) {
    const { 0: client, 1: server } = new WebSocketPair();

    this.clients.add(client);

    server.addEventListener('close', (cls: CloseEvent) => {
      this.clients.delete(client);
    });

    server.addEventListener('message', (event: MessageEvent) => {
      server.send(`# clients: ${this.clients.size}\n`);
    });

    server.accept();
    server.send('Hello, client!');

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
}

async function dbFetch() {
  const response = await fetch('https://example.com');
  return response.text();
}