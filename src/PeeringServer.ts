import { createServer, method } from '@danscan/zod-jsonrpc';
import { z } from 'zod';

/** A proposed session's url, and the protocols it requires and supports */
export type PeerSessionProposal = z.infer<typeof PeerSessionProposalSchema>;
export const PeerSessionProposalSchema = z.object({
  /** The URL of the proposed session */
  url: z.string().url(),
  /** The protocols the proposed session requires */
  requires: z.string().array(),
  /** The protocols the proposed session supports */
  supports: z.string().array(),
});

/** The result of a session proposal exchange */
export type PeerSessionProposalResult = z.infer<typeof PeerSessionProposalResultSchema>;
export const PeerSessionProposalResultSchema = z.discriminatedUnion('accepted', [
  z.object({ accepted: z.literal(true), proposal: PeerSessionProposalSchema }),
  z.object({ accepted: z.literal(false) }),
]);

/** Configuration for a peering server */
export type CreatePeeringServerConfig = {
  /** Called when a peer connection is established */
  onPeerConnected: (remotePeerSessionUrl: string) => Promise<void>;
  /** Called when a peer connection is closed */
  onPeerDisconnected: () => Promise<void>;
  /** Returns the local peer's proposed session to the remote peer */
  onRequestSessionProposal: () => Promise<PeerSessionProposal>;
};

/**
 * Creates a peering server, supporting the peering protocol version 1.
 * Methods:
 * - `@danscanrpc/peering@v1/peer`: Establishes a peering session connection by exchanging session proposals.
 * - `@danscanrpc/peering@v1/disconnect`: Closes a peering session connection.
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
    '@danscanrpc/peering@v1/peer': method({
      paramsSchema: PeerSessionProposalSchema,
      resultSchema: PeerSessionProposalResultSchema,
    }, async (remoteSessionProposal) => {
      // Get the local peer's proposed session
      const localSessionProposal = await onRequestSessionProposal();

      // Check if the remote peer's required protocols are supported by the local peer's proposed session
      const remoteRequirementsMet = remoteSessionProposal.requires.every((protocol: string) => localSessionProposal.supports.includes(protocol));
      // Check if the local peer's supported protocols are required by the remote peer's proposed session
      const localRequirementsMet = remoteSessionProposal.supports.every((protocol: string) => localSessionProposal.requires.includes(protocol));
      // Peering is viable if both peers' requirements are met
      const peeringViable = remoteRequirementsMet && localRequirementsMet;

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
    '@danscanrpc/peering@v1/disconnect': method({
      paramsSchema: z.void(),
      resultSchema: z.void(),
    }, () => onPeerDisconnected()),
  });
}
