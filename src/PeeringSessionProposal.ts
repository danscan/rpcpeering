import { z } from 'zod';

/**
 * A Peering Session Proposal
 * 
 * This is the parameters schema 
 */
export type PeeringSessionProposal = z.infer<typeof PeeringSessionProposalSchema>;
export const PeeringSessionProposalSchema = z.object({
  /** The topic of the proposed session */
  topic: z.string(),
  /** The URL of the proposed session */
  url: z.string().url(),
  /** Additional supported topics advertised by the proposing party */
  advertise: z.string().array(),
});

/**
 * The result of a peering session proposal exchange.
 */
export type PeeringSessionProposalResult = z.infer<typeof PeeringSessionProposalResultSchema>;
export const PeeringSessionProposalResultSchema = z.discriminatedUnion('accepted', [
  z.object({ accepted: z.literal(true), proposal: PeeringSessionProposalSchema }),
  z.object({ accepted: z.literal(false) }),
]);
