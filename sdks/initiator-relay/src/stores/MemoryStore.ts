import { SessionNotFoundError } from './_errors';
import type { ISessionStore, SessionId, SessionResponder } from './_types';

// State
const sessions = new Map<SessionId, SessionResponder>();

export class MemoryStore implements ISessionStore {
  async setSessionResponder(id: SessionId, responder: SessionResponder): Promise<void> {
    sessions.set(id, responder);
  }

  async getSessionResponder(id: SessionId): Promise<SessionResponder | null> {
    const session = sessions.get(id);
    if (!session) throw new SessionNotFoundError();
    return session;
  }

  async deleteSession(id: SessionId): Promise<void> {
    sessions.delete(id);
  }
}
