import { z } from 'zod';
import { type Methods } from '../jsonrpc/Server';

// Type aliases
type SessionId = string;
type ResponderPeerUrl = URL;
type SessionCreated = boolean;
type SessionClosed = boolean;

export type SupportPeeringV1Config = {
  /**
   * The callback to be called when a peer session is created. It registers the responder peer URL for the session,
   * and returns whether the session was created successfully.
   * 
   * Params:
   * - sessionId: string - The ID of the session to be established
   * - responderPeerUrl: string - The RPC URL of the session's responder peer
   * 
   * Returns:
   * boolean - Whether the session was created successfully
   */
  onCreatePeerSession: (sessionId: SessionId, responderPeerUrl: ResponderPeerUrl) => Promise<SessionCreated>,

  /**
   * The callback to be called when a peer session is closed.
   * 
   * Params:
   * - sessionId: string - The ID of the session to be closed
   * 
   * Returns:
   * boolean - Whether the session was closed successfully
   */
  onClosePeerSession: (sessionId: SessionId) => Promise<SessionClosed>,
};

export function supportPeeringV1({
  onCreatePeerSession,
  onClosePeerSession,
}: SupportPeeringV1Config): Methods {
  return {
    /**
     * Initiates a peering session between the initiator and responder
     */
    'danscanrpc-peering@v1_peerSession': {
      /**
       * The parameters for the `danscanrpc-peering@v1_peerSession` method
       * 
       * - sessionId - The ID of the session to be established
       * - responderPeerUrl - The RPC URL of the session's responder peer
       */
      paramsSchema: z.tuple([
        z.string(),
        z.string().url(),
      ]),

      /**
       * The result of the `danscanrpc-peering@v1_peerSession` method
       * 
       * sessionCreated - Whether the session was created successfully
       */
      resultSchema: z.boolean(),

      /**
       * The handler for the `danscanrpc-peering@v1_peerSession` method
       * 
       * Calls the `onCreatePeerSession` callback with the session ID and responder peer URL,
       * and returns whether the session was created successfully.
       */
      handler: ([sessionId, responderPeerUrl]) => onCreatePeerSession(sessionId, responderPeerUrl),
    },

    /**
     * Closes a peering session
     */
    'danscanrpc-peering@v1_closeSession': {
      /**
       * The parameters for the `danscanrpc-peering@v1_closeSession` method
       * 
       * - sessionId - The ID of the session to be closed
       */
      paramsSchema: z.tuple([z.string()]),

      /**
       * The result of the `danscanrpc-peering@v1_closeSession` method
       * 
       * sessionClosed - Whether the session was closed successfully
       */
      resultSchema: z.boolean(),

      /**
       * The handler for the `danscanrpc-peering@v1_closeSession` method
       * 
       * Calls the `onClosePeerSession` callback with the session ID,
       * and returns whether the session was closed successfully.
       */
      handler: ([sessionId]) => onClosePeerSession(sessionId),
    },
  };
}
