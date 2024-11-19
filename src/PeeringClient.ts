import { createClient, method } from '@danscan/zod-jsonrpc';
import { z } from 'zod';
import { PeeringSessionProposalResultSchema, PeeringSessionProposalSchema, type PeeringSessionProposal } from './PeeringSessionProposal';

export type PeeringClient = {
  /** Establishes a peering session connection by exchanging session proposals. */
  peer: (proposal: PeeringSessionProposal) => Promise<PeeringSessionProposal>;
  /** Closes a peering session connection. */
  disconnect: () => Promise<void>;
};

/** Creates a new PeeringClient */
export function createPeeringClient(sendRequest: SendRequestFn): PeeringClient {
  const client =  createClient({
    'rpcpeering1/peer': method({
      paramsSchema: PeeringSessionProposalSchema,
      resultSchema: PeeringSessionProposalResultSchema,
    }),

    'rpcpeering1/disconnect': method({
      paramsSchema: z.void(),
      resultSchema: z.void(),
    }),
  }, sendRequest);

  return {
    async peer(proposal) {
      const result = await client['rpcpeering1/peer'](proposal);
      if (!result.accepted) throw new PeeringClientError.PeerRejectedProposalError();
      return result.proposal;
    },
    async disconnect() {
      await client['rpcpeering1/disconnect']();
    },
  }
}

export class PeeringClientError extends Error {
  static PeerRejectedProposalError = class extends PeeringClientError {
    name = 'PeerRejectedProposalError';
    message = 'The peer rejected the proposal';
  }
}

/** The type of the `sendRequest` function passed to `createPeeringClient` */
type SendRequestFn = (request: Record<string, any>) => Promise<Record<string, any>>;
