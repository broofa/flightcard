import { type BaseModel, isLaunchModel } from '@flightcard/models';
import { DurableObject } from 'cloudflare:workers';

export class LaunchDO extends DurableObject {
  #clients = new Set<WebSocket>();
  #launchStateRequest?: Promise<unknown>;
  #launchState?: BaseModel[];

  #initState(url: string) {
    if (!this.#launchStateRequest) {
      const stateURL = new URL(url);
      stateURL.pathname = stateURL.pathname.replace('/realtime', '/state');

      this.#launchStateRequest = fetch(stateURL)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch state: ${response.statusText}`);
          }
          return response.json();
        })
        .then((state) => {
          this.#launchState = state as BaseModel[];

          setInterval(this.mockChanges, 2000);
        });
    }

    return this.#launchStateRequest;
  }

  #broadcast(msg: string | Record<string, unknown> | unknown[]) {
    if (typeof msg !== 'string') {
      msg = JSON.stringify(msg);
    }

    for (const client of this.#clients) {
      client.send(msg);
    }
  }

  mockChanges = () => {
    const launch = this.#launchState?.[0];
    if (!isLaunchModel(launch)) return;
    const { launchID, name = '' } = launch;
    this.#broadcast([
      launchID,
      { name: name.replace(/ - .*/, '') + ' - ' + Date.now() },
    ]);
  };

  async fetch(req: Request) {
    try {
      await this.#initState(req.url);
    } catch (error) {
      console.error('initState() failed', error);
      return new Response('initState() failed', { status: 500 });
    }

    const { 0: local, 1: remote } = new WebSocketPair();

    this.#clients.add(local);

    local.addEventListener('close', (cls: CloseEvent) => {
      this.#clients.delete(local);
    });

    local.addEventListener('message', (event: MessageEvent) => {
      local.send(`# clients: ${this.#clients.size}\n`);
    });

    local.accept();
    local.send(JSON.stringify(this.#launchState));

    return new Response(null, {
      status: 101,
      webSocket: remote,
    });
  }
}
