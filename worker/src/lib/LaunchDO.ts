import { DurableObject } from 'cloudflare:workers';

export class LaunchDO extends DurableObject {
  nClients = 0;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request: Request): Promise<Response> {
    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Calling `accept()` tells the runtime that this WebSocket is to begin terminating
    // request within the Durable Object. It has the effect of "accepting" the connection,
    // and allowing the WebSocket to send and receive messages.
    server.accept();
    this.nClients += 1;

    // Upon receiving a message from the client, the server replies with the same message,
    // and the total number of connections with the "[Durable Object]: " prefix
    server.addEventListener('message', (event: MessageEvent) => {
      console.log('Received message:', event.data);
      server.send(
        `[Durable Object] currentlyConnectedWebSockets: ${this.nClients}`
      );
    });

    // If the client closes the connection, the runtime will close the connection too.
    server.addEventListener('close', (cls: CloseEvent) => {
      this.nClients -= 1;
      server.close(cls.code, 'Durable Object is closing WebSocket');
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
