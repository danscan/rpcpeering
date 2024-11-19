import { PeeringSessionProposalSchema, type PeeringSessionProposal } from "./PeeringSessionProposal";

const PROPOSAL_QUERY_PARAM = 'org.rpcpeering.proposal';

/** Checks if a WC URI includes a peering proposal */
export function uriIncludesSessionProposal(wcUri: string) {
  const queryParams = new URLSearchParams(wcUri.split('?')[1]);
  const proposal = queryParams.get(PROPOSAL_QUERY_PARAM);
  return proposal
    ? PeeringSessionProposalSchema.safeParse(JSON.parse(base64UrlDecode(proposal))).success
    : false;
}

/** Upgrades a WC URI to include a peering proposal */
export function upgradeWCUri(wcUri: string, sessionProposal: PeeringSessionProposal) {
  const [wcUriWithoutQuery, query] = wcUri.split('?');
  const queryParams = new URLSearchParams(query);
  queryParams.set(PROPOSAL_QUERY_PARAM, base64UrlEncode(JSON.stringify(sessionProposal)));
  return `${wcUriWithoutQuery}?${queryParams.toString()}`;
}

/** Parses a peering proposal from a WC URI */
export function parseUpgradeWCUri(wcUri: string) {
  const queryParams = new URLSearchParams(wcUri.split('?')[1]);
  const proposal = queryParams.get(PROPOSAL_QUERY_PARAM);
  if (!proposal) return null;
  return PeeringSessionProposalSchema.parse(JSON.parse(base64UrlDecode(proposal)));
}

/** Util that encodes a string to base64url */
export function base64UrlEncode(str: string) {
  return Buffer.from(str).toString('base64url');
}

/** Util that decodes a base64url string */
export function base64UrlDecode(str: string) {
  return Buffer.from(str, 'base64url').toString();
}
