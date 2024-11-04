// Type Aliases
export type SessionId = string;
export type SessionRequestProtocol = string;
export type SessionResponder = { url: URL; protocols: SessionRequestProtocol[] };

export interface ISessionStore {
  /** Set the responder for a session */
  setSessionResponder(id: SessionId, responder: SessionResponder): Promise<void>;

  /** Get the responder for a session */
  getSessionResponder(id: SessionId): Promise<SessionResponder | null>;

  /** Delete a session */
  deleteSession(id: SessionId): Promise<void>;
}
