import type { ISessionStore, SessionId, SessionRequestProtocol } from '../../stores/_types';
import { RouteType, type CreateSessionRoute, type GetSessionInitiatorRoute, type GetSessionResponderRoute, type RelaySessionInitiatorRequestRoute, type RelaySessionResponderRequestRoute, type RequestRouter } from './RequestRouter';

export type RequestHandlerConfiguration = {
  logger?: (...args: any[]) => void;
  store: ISessionStore;
  router: RequestRouter;
  onSessionInitiatorRequest: (sessionId: SessionId, protocols: SessionRequestProtocol[], request: Request) => Promise<Response>;
  getSessionInitiator: (sessionId: SessionId) => Promise<{ protocols: SessionRequestProtocol[] }>;
};

export class RequestHandler implements RequestHandlerConfiguration {
  logger: RequestHandlerConfiguration['logger'];
  store: RequestHandlerConfiguration['store'];
  router: RequestHandlerConfiguration['router'];
  onSessionInitiatorRequest: RequestHandlerConfiguration['onSessionInitiatorRequest'];
  getSessionInitiator: RequestHandlerConfiguration['getSessionInitiator'];

  constructor(config: RequestHandlerConfiguration) {
    this.logger = config.logger;
    this.store = config.store;
    this.router = config.router;
    this.onSessionInitiatorRequest = config.onSessionInitiatorRequest;
    this.getSessionInitiator = config.getSessionInitiator;
  }

  async handleRequest(req: Request) {
    try {
      const route = await this.router.matchRoute(req);
      switch (route.type) {
        case RouteType.createSession: return this.createSession(route);
        case RouteType.relaySessionResponderRequest: return this.relaySessionResponderRequest(route);
        case RouteType.getSessionResponderRoute: return this.getSessionResponder(route);
        case RouteType.relaySessionInitiatorRequest: return this.onSessionInitiatorRequest(route.sessionId, route.protocols, route.request);
        case RouteType.getSessionInitiatorRoute: return Response.json(await this.getSessionInitiator(route.sessionId));
      }
    } catch (error) {
      this.logger?.('RequestHandler.handleRequest', 'Failed to handle request', { error });
      return Response.json(error, { status: 500 });
    }
  }

  private async createSession(route: CreateSessionRoute) {
    try {
      this.store.setSessionResponder(route.sessionId, { url: route.responder.url, protocols: route.responder.protocols });
      const initiator = await this.getSessionInitiator(route.sessionId);
      this.logger?.('RequestHandler.createSession', 'Created session', { sessionId: route.sessionId, responder: route.responder, routes: this.router.routes, initiator });
      return Response.json({
        routes: this.router.routes,
        initiator,
      }, { status: 201 });
    } catch (error) {
      this.logger?.('Failed to create session', { error });
      return new Response('Invalid RPC URL', { status: 400 });
    }
  }

  private async relaySessionResponderRequest(route: RelaySessionResponderRequestRoute) {
    const sessionResponder = await this.store.getSessionResponder(route.sessionId);
    this.logger?.('RequestHandler.relaySessionResponderRequest', 'Relaying session responder request', { sessionId: route.sessionId, sessionResponder, protocols: route.protocols });
    if (!sessionResponder) return new Response('Session not found', { status: 404 });

    const unsupportedProtocols = getUnsupportedProtocols(route.protocols, sessionResponder.protocols);
    this.logger?.('RequestHandler.relaySessionResponderRequest', 'Unsupported protocols', { sessionId: route.sessionId, unsupportedProtocols });
    if (unsupportedProtocols.length > 0) return Response.json({ error: 'Unsupported protocols', unsupported: unsupportedProtocols }, { status: 400 });

    this.logger?.('RequestHandler.relaySessionResponderRequest', 'Forwarding request to session', { sessionId: route.sessionId, sessionResponder, protocols: route.protocols });
  
    try {
      // Create headers for the new request
      const headers = new Headers(route.request.headers);
      headers.set('Host', sessionResponder.url.host);
      headers.set('X-Session-Id', route.sessionId);
  
      const sessionRes = await fetch(sessionResponder.url, {
        ...route.request,
        method: 'POST',
        headers,
        body: await route.request.arrayBuffer(),
      });
      return new Response(sessionRes.body, {
        status: sessionRes.status,
        statusText: sessionRes.statusText,
        headers: sessionRes.headers,
      });
    } catch (error) {
      this.logger?.('RequestHandler.relaySessionResponderRequest', 'Failed to forward request', { error });
      return new Response('Failed to forward request', { status: 500 });
    }
  }

  private async getSessionResponder(route: GetSessionResponderRoute) {
    const sessionResponder = await this.store.getSessionResponder(route.sessionId);
    this.logger?.('RequestHandler.getSessionResponder', 'Getting session responder', { sessionId: route.sessionId, sessionResponder });
    if (!sessionResponder) return new Response('Session not found', { status: 404 });
    return Response.json(sessionResponder);
  }
}

// –
// Helpers
// –

/**
 * Returns the requested protocols that are not supported by the responder
 */
function getUnsupportedProtocols(requested: SessionRequestProtocol[], supported: SessionRequestProtocol[]) {
  return requested.filter(protocol => !supported.includes(protocol));
}
