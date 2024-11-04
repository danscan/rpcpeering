import { z } from 'zod';
import { Server } from '../src/jsonrpc/Server';

/**
 * Responder RPC Server
 *
 * This is an example of a responder server that supports a single RPC method.
 */
const rpcServer = new Server({
  greet: {
    paramsSchema: z.tuple([z.string()]),
    resultSchema: z.string(),
    handler: async ([name]) => `Hello, ${name}!`,
  },
});

/**
 * HTTP Server
 *
 * This is the HTTP server that will route requests to the RPC server.
 */
const server = Bun.serve({
  port: 3001,
  async fetch(req) {
    const body = await req.json();
    return Response.json(await rpcServer.handle(body));
  },
});

console.log('ResponderServer', `Listening on ${server.url}`);