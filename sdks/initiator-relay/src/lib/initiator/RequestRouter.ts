import type { SessionRequestProtocol, SessionResponder } from '../../stores/_types';

// Route spec segments
type RouteSpecSegmentSession = '[session]';
type RouteSpecSegmentProtocols = '[protocols]';

export enum RouteType {
  // Session Creation
  createSession = 'createSession',

  // Session Responders
  relaySessionResponderRequest = 'relaySessionResponderRequest',
  getSessionResponderRoute = 'getSessionResponderRoute',

  // Session Initiators
  relaySessionInitiatorRequest = 'relaySessionInitiatorRequest',
  getSessionInitiatorRoute = 'getSessionInitiatorRoute',
}

// A map of route types to their specs
type RequestRouterConfiguration = {
  // Session Creation
  /** A POST request to create a session */
  [RouteType.createSession]: `${string}${RouteSpecSegmentSession}${string}${RouteSpecSegmentProtocols}${string}`;

  // Session Responders
  /** A POST request to relay a session request to its responder */
  [RouteType.relaySessionResponderRequest]: `${string}${RouteSpecSegmentSession}${string}${RouteSpecSegmentProtocols}${string}`;
  /** A GET request to get a session's responder data */
  [RouteType.getSessionResponderRoute]: `${string}${RouteSpecSegmentSession}${string}`;

  // Session Initiators
  /** A POST request to relay a session request to its initiator */
  [RouteType.relaySessionInitiatorRequest]: `${string}${RouteSpecSegmentSession}${string}${RouteSpecSegmentProtocols}${string}`;
  /** A GET request to get a session's initiator data */
  [RouteType.getSessionInitiatorRoute]: `${string}${RouteSpecSegmentSession}${string}`; 
};

// Routes
export type Route =
  // Session Creation
  | CreateSessionRoute

  // Session Responders
  | RelaySessionResponderRequestRoute
  | GetSessionResponderRoute

  // Session Initiators
  | RelaySessionInitiatorRequestRoute
  | GetSessionInitiatorRoute;

export type CreateSessionRoute = { type: RouteType.createSession, sessionId: string, responder: SessionResponder };
export type RelaySessionResponderRequestRoute = { type: RouteType.relaySessionResponderRequest, sessionId: string, protocols: string[], request: Request };
export type GetSessionResponderRoute = { type: RouteType.getSessionResponderRoute, sessionId: string };
export type RelaySessionInitiatorRequestRoute = { type: RouteType.relaySessionInitiatorRequest, sessionId: string, protocols: string[], request: Request };
export type GetSessionInitiatorRoute = { type: RouteType.getSessionInitiatorRoute, sessionId: string };

// A supported route
export type SupportedRoute = { type: RouteType, method: string, path: string, description: string };

export class RequestRouter {
  config: RequestRouterConfiguration;

  constructor(config: RequestRouterConfiguration) {
    this.config = config;
  }

  /** The supported routes */
  get routes(): SupportedRoute[] {
    return [
      { type: RouteType.createSession, method: 'POST', path: this.config[RouteType.createSession], description: `Create a session` },
      { type: RouteType.relaySessionResponderRequest, method: 'POST', path: this.config[RouteType.relaySessionResponderRequest], description: `Relay a request to a session's responder` },
      { type: RouteType.getSessionResponderRoute, method: 'GET', path: this.config[RouteType.getSessionResponderRoute], description: `Get a session's responder. Result type: { url: string, protocols: string[] }` },
      { type: RouteType.relaySessionInitiatorRequest, method: 'POST', path: this.config[RouteType.relaySessionInitiatorRequest], description: `Relay a request to a session's initiator` },
      { type: RouteType.getSessionInitiatorRoute, method: 'GET', path: this.config[RouteType.getSessionInitiatorRoute], description: `Get a session's initiator. Result type: { protocols: string[] }` },
    ];
  }

  async matchRoute(request: Request): Promise<Route> {
    // Session Creation
    const createSessionMatch = matchRouteSpec('POST', this.config[RouteType.createSession], request);

    // Session Responders
    const relaySessionResponderRequestMatch = matchRouteSpec('POST', this.config[RouteType.relaySessionResponderRequest], request);
    const getSessionResponderRouteMatch = matchRouteSpec('GET', this.config[RouteType.getSessionResponderRoute], request);

    // Session Initiators
    const relaySessionInitiatorRequestMatch = matchRouteSpec('POST', this.config[RouteType.relaySessionInitiatorRequest], request);
    const getSessionInitiatorRouteMatch = matchRouteSpec('GET', this.config[RouteType.getSessionInitiatorRoute], request);

    // Create session
    if (createSessionMatch) {
      const protocols = parseProtocols(createSessionMatch.protocols);
      const responderUrl = await request.text();
      const responder: SessionResponder = { url: new URL(responderUrl), protocols };

      return { type: RouteType.createSession, sessionId: createSessionMatch.session, responder };
    }

    // Relay inbound request
    if (relaySessionResponderRequestMatch) {
      const protocols = parseProtocols(relaySessionResponderRequestMatch.protocols);
      return { type: RouteType.relaySessionResponderRequest, sessionId: relaySessionResponderRequestMatch.session, protocols, request };
    }

    // Relay outbound request
    if (relaySessionInitiatorRequestMatch) {
      const protocols = parseProtocols(relaySessionInitiatorRequestMatch.protocols);
      return { type: RouteType.relaySessionInitiatorRequest, sessionId: relaySessionInitiatorRequestMatch.session, protocols, request };
    }

    // Get outbound protocols
    if (getSessionResponderRouteMatch) {
      return { type: RouteType.getSessionResponderRoute, sessionId: getSessionResponderRouteMatch.session };
    }

    // Get inbound schemas
    if (getSessionInitiatorRouteMatch) {
      return { type: RouteType.getSessionInitiatorRoute, sessionId: getSessionInitiatorRouteMatch.session };
    }

    throw new RequestRouter.ERRORS.InvalidRoute(this.routes);
  }

  // –
  // Errors
  // –
  static ERRORS = {
    InvalidRoute: class InvalidRouteError extends Error {
      name = 'InvalidRouteError';
      message = 'The request path does not match any supported route. See `routes` for supported routes.';
      routes: SupportedRoute[];

      constructor(routes: SupportedRoute[]) {
        super();
        this.routes = routes;
      }
    }
  }
}

// –
// Helpers
// –

function parseProtocols(protocolsComponent: string): SessionRequestProtocol[] {
  return decodeURIComponent(protocolsComponent)
    .split(',')
    .map(schema => schema);
}

function matchRouteSpec(method: string, routeSpec: string, request: Request): Record<string, string> | false {
  // Check the method
  if (request.method.toUpperCase() !== method.toUpperCase()) return false;

  // Parse the URL
  const url = new URL(request.url);
  const path = url.pathname;

  // Parse the route spec
  const paramNames: string[] = [];
  const regex = new RegExp('^' + routeSpec.replace(/\[([^\]]+)\]/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
  }) + '$');
  
  // Match the path
  const match = path.match(regex);
  if (!match) return false;
  
  // Return the parameters
  return Object.fromEntries(paramNames.map((name, i) => [name, match[i + 1]]));
}