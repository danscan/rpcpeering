import { Database, Statement } from 'bun:sqlite';
import type { ISessionStore, SessionId, SessionResponder } from './_types';

type SessionRow = {
  id: string;
  responder_url: string;
  responder_protocols: string;
};

export class BunSqliteStore implements ISessionStore {
  db: Database;

  private setResponderStmt: Statement;
  private getResponderStmt: Statement;
  private deleteSessionStmt: Statement;

  constructor(filename: string) {
    this.db = new Database(filename);

    // Create the sessions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        responder_url TEXT,
        responder_protocols TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prepare the statements
    this.setResponderStmt = this.db.prepare(`INSERT INTO sessions (id, responder_url, responder_protocols) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET responder_url = ?, responder_protocols = ?`);
    this.getResponderStmt = this.db.prepare(`SELECT * FROM sessions WHERE id = ?`);
    this.deleteSessionStmt = this.db.prepare(`DELETE FROM sessions WHERE id = ?`);
  }

  async setSessionResponder(id: SessionId, responder: SessionResponder): Promise<void> {
    this.setResponderStmt.run(
      id,
      responder.url.toString(),
      responder.protocols.join(','),
      // On-conflict update values
      responder.url.toString(),
      responder.protocols.join(','),
    );
  }

  async getSessionResponder(id: SessionId): Promise<SessionResponder | null> {
    return parseSessionRow(this.getResponderStmt.get(id));
  }


  async deleteSession(id: SessionId): Promise<void> {
    this.deleteSessionStmt.run(id);
  }

  // –
  // Errors
  // –
  static ERRORS = {
    /**
     * Error thrown when a session row is invalid
     */
    InvalidSessionRow: class InvalidSessionRowError extends Error {
      name = 'InvalidSessionRowError';
      message = 'Invalid session row';
      invalidRow: unknown;

      constructor(invalidRow: unknown) {
        super();
        this.invalidRow = invalidRow;
      }
    },

    /**
     * Error thrown when a responder URL is invalid
     */
    InvalidResponderUrl: class InvalidResponderUrlError extends Error {
      name = 'InvalidResponderUrlError';
      message = 'Invalid responder URL';
      invalidUrl: unknown;

      constructor(invalidUrl: unknown) {
        super();
        this.invalidUrl = invalidUrl;
      }
    },

    /**
     * Error thrown when a responder URL is missing
     */
    ResponderProtocolsEmpty: class ResponderProtocolsEmptyError extends Error {
      name = 'ResponderProtocolsEmptyError';
      message = 'Responder protocols are empty';
    },
  };
}

// –
// Helpers
// –
function parseSessionRow(row: unknown): SessionResponder | null {
  const sessionRow = row as SessionRow;

  // If the session row is null, return null
  if (!sessionRow) return null;

  // Validate the session row
  const sessionRowIsValid = typeof sessionRow.responder_url === 'string'
    && typeof sessionRow.responder_protocols === 'string';
  if (!sessionRowIsValid) throw new BunSqliteStore.ERRORS.InvalidSessionRow(sessionRow);

  // Validate the session's responder URL
  if (!URL.canParse(sessionRow.responder_url)) throw new BunSqliteStore.ERRORS.InvalidResponderUrl(sessionRow.responder_url);
  const url = new URL(sessionRow.responder_url);

  // Validate the session's responder protocols
  const protocols = sessionRow.responder_protocols.split(',');
  if (protocols.length === 0) throw new BunSqliteStore.ERRORS.ResponderProtocolsEmpty();

  return { url, protocols };
}
