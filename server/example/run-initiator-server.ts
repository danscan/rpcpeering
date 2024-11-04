import { z } from 'zod';
import { Server } from '../src/jsonrpc/Server';
import { supportPeeringV1 } from '../src/protocols/danscanrpc_v1';

const BASE_URL = 'http://localhost:3000';

/**
 * Session Storage
 *
 * This is a simple in-memory storage for the session peers.
 * In a production environment, you'll want to use a database or a more persistent storage.
 */
const sessionPeers = new Map<string, URL>();

/**
 * Peering RPC Server
 *
 * This is the server that will handle the peering protocol, and any inbound RPC requests.
 */
export const peeringRpcServer = new Server({
  // Add the support for the peering protocol
  ...supportPeeringV1({
    onCreatePeerSession: async (sessionId, responderPeerUrl) => {
      console.log('supportPeeringV1.onCreatePeerSession', { sessionId, responderPeerUrl });
      console.log('Session created. TODO: Notify initiator client of the session URI it can use to send requests to responder:', `${BASE_URL}/${sessionId}`);
      sessionPeers.set(sessionId, responderPeerUrl);
      return true;
    },
    onClosePeerSession: async (sessionId) => {
      console.log('supportPeeringV1.onClosePeerSession', { sessionId });
      sessionPeers.delete(sessionId);
      return true;
    },
  }),

  // ...Support any other RPC methods...
  example_getSessionResponderPeerUrl: {
    paramsSchema: z.tuple([z.string()]), // [sessionId]
    resultSchema: z.string().url(),
    handler: async ([sessionId]) => sessionPeers.get(sessionId),
  },
});

/**
 * HTTP Server
 *
 * This is the HTTP server that will route `POST /` requests to the peering RPC server,
 * and proxy  `POST /<sessionId>` requests to the session relay peer.
 */
const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    switch (url.pathname) {
      // Peering RPC: handle requests to the peering server
      case '/':
        return Response.json(await peeringRpcServer.handle(await req.json()));

      // Session relay: proxy requests to the session peer
      default:
        const sessionId = url.pathname.split('/')[1];
        return proxySessionRequest(sessionId, req);
    }
  },
});

console.log('InitiatorServer', `Listening on ${server.url}`);

/**
 * Session Proxy
 *
 * This function proxies requests to the session peer.
 */
async function proxySessionRequest(sessionId: string, req: Request): Promise<Response> {
  const sessionPeerUrl = sessionPeers.get(sessionId);
  if (!sessionPeerUrl) {
    return Response.json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } }, { status: 404 });
  }

  try {
    // Create headers for the new request
    const headers = new Headers(req.headers);
    headers.set('Host', sessionPeerUrl.host);
    headers.set('X-Session-Id', sessionId);

    const sessionRes = await fetch(sessionPeerUrl, {
      ...req,
      method: 'POST',
      headers,
      body: await req.arrayBuffer(),
    });
    return new Response(sessionRes.body, {
      status: sessionRes.status,
      statusText: sessionRes.statusText,
      headers: sessionRes.headers,
    });
  } catch (error) {
    console.error('InitiatorRPCServer.fetch', 'Failed to forward request', { error });
    return new Response('Failed to forward request', { status: 500 });
  }
}
