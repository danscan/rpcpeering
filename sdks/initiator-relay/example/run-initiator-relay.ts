import { RequestHandler } from '../src/lib/initiator/RequestHandler';
import { RequestRouter } from '../src/lib/initiator/RequestRouter';
import { MemoryStore } from '../src/stores/MemoryStore';

const store = new MemoryStore();
const router = new RequestRouter({
  createSession: '/sessions/[session]/[protocols]',
  relaySessionResponderRequest: '/sessions/[session]/responder/requests/[protocols]',
  getSessionResponderRoute: '/sessions/[session]/responder',
  relaySessionInitiatorRequest: '/sessions/[session]/initiator/requests/[protocols]',
  getSessionInitiatorRoute: '/sessions/[session]/initiator',
});

const handler = new RequestHandler({
  logger: (...args) => console.log(...args),
  store,
  router,
  onSessionInitiatorRequest: async (sessionId, protocols, request) => {
    const requestBody = await request.json();
    console.log('InitiatorRelay', 'handler.onSessionInitiatorRequest', 'Relaying session initiator request', { sessionId, protocols, requestBody });

    if (protocols.includes('danscanrpc-v1') && requestBody.method === 'set_responder' && requestBody.id && requestBody.params?.url && requestBody.params?.protocols) {
      const { protocols, url } = requestBody.params;
      await store.setSessionResponder(sessionId, { url: new URL(url), protocols });
      return Response.json({ jsonrpc: '2.0', method: 'set_responder', result: true, id: requestBody.id }, { status: 200 });
    }

    return Response.json({ message: 'Not implemented' }, { status: 501 });
  },
  getSessionInitiator: async (sessionId) => {
    console.log('InitiatorRelay', 'handler.getSessionInitiator', 'Getting session initiator', { sessionId });
    return { protocols: ['ethereum', 'danscanrpc-v1'] };
  },
});

const server = Bun.serve({
  fetch(req) {
    try {
      return handler.handleRequest(req);
    } catch (error) {
      console.error('Server', 'Failed to handle request', error);
      return Response.json(error, { status: 500 });
    }
  },
});

console.log('InitiatorRelay', `Listening on ${server.url}`);