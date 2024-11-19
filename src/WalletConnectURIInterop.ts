import { PeeringSessionProposalSchema, type PeeringSessionProposal } from "./PeeringSessionProposal";

const PROPOSAL_QUERY_PARAM = 'org.rpcpeering.proposal';

/** Utilities for base64url encoding and decoding */
const utils = {
  /** Util that encodes a string to base64url */
  base64UrlEncode(str: string) {
    return Buffer.from(str).toString('base64url');
  },

  /** Util that decodes a base64url string */
  base64UrlDecode(str: string) {
    return Buffer.from(str, 'base64url').toString();
  },
} as const;

/** Utilities for interoperability with WalletConnect URIs */
export const WalletConnectURIInterop = {
  /** Checks if a WC URI includes a peering proposal */
  includesProposal(wcUri: string) {
    const queryParams = new URLSearchParams(wcUri.split('?')[1]);
    const proposal = queryParams.get(PROPOSAL_QUERY_PARAM);
    return proposal
      ? PeeringSessionProposalSchema.safeParse(JSON.parse(utils.base64UrlDecode(proposal))).success
      : false;
  },

  /** Upgrades a WC URI to include a peering proposal */
  upgrade(wcUri: string, sessionProposal: PeeringSessionProposal) {
    const [wcUriWithoutQuery, query] = wcUri.split('?');
    const queryParams = new URLSearchParams(query);
    queryParams.set(PROPOSAL_QUERY_PARAM, utils.base64UrlEncode(JSON.stringify(sessionProposal)));
    return `${wcUriWithoutQuery}?${queryParams.toString()}`;
  },

  /** Parses a peering proposal from a WC URI */
  parse(wcUri: string) {
    const queryParams = new URLSearchParams(wcUri.split('?')[1]);
    const proposal = queryParams.get(PROPOSAL_QUERY_PARAM);
    if (!proposal) return null;
    return PeeringSessionProposalSchema.parse(JSON.parse(utils.base64UrlDecode(proposal)));
  },

  /** Utility functions for base64url encoding and decoding */
  utils,
} as const;
