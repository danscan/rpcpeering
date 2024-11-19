import { createServer, method } from '@danscan/zod-jsonrpc';
import { z } from 'zod';
import { PeeringSessionProposalResultSchema, PeeringSessionProposalSchema, type PeeringSessionProposal } from './PeeringSessionProposal';

/** Configuration for a peering server */
export type CreatePeeringServerConfig = {
  /** Called when a peer connection is established */
  onPeerConnected: (remotePeerSessionUrl: string) => Promise<void>;
  /** Called when a peer connection is closed */
  onPeerDisconnected: () => Promise<void>;
  /** Returns the local peer's proposed session to the remote peer */
  onRequestSessionProposal: () => Promise<PeeringSessionProposal>;
};

/**
 * Creates a peering server, supporting the peering protocol version 1.
 * Methods:
 * - `rpcpeering1/peer`: Establishes a peering session connection by exchanging session proposals.
 * - `rpcpeering1/disconnect`: Closes a peering session connection.
 */
export function createPeeringServer({
  onPeerConnected,
  onPeerDisconnected,
  onRequestSessionProposal,
}: CreatePeeringServerConfig) {
  return createServer({
    /**
     * Establishes a peering session connection by exchanging session proposals.
     * The remote session proposal is accepted if both peers' requirements are met.
     */
    'rpcpeering1/peer': method({
      paramsSchema: PeeringSessionProposalSchema,
      resultSchema: PeeringSessionProposalResultSchema,
    }, async (remoteSessionProposal) => {
      // Get the local peer's proposed session
      const localSessionProposal = await onRequestSessionProposal();
      // Peering is viable if the topics match
      const peeringViable = localSessionProposal.topic === remoteSessionProposal.topic;

      // If peering is not viable, the proposed remote session is rejected
      if (!peeringViable) {
        return { accepted: false } as const;
      }

      // Peering is viable. Connect the peers.
      await onPeerConnected(remoteSessionProposal.url);

      // Return the local peer's session proposal
      return {
        accepted: true,
        proposal: localSessionProposal,
      } as const;
    }),

    /**
     * Closes a peering session connection
     */
    'rpcpeering1/disconnect': method({
      paramsSchema: z.void(),
      resultSchema: z.void(),
    }, () => onPeerDisconnected()),
  });
}
