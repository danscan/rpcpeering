import { describe, it, expect } from 'bun:test';
import { WalletConnectURIInterop } from './WalletConnectURIInterop';

const PROPOSAL = { topic: 'test', url: 'https://example.rpcpeering.org', advertise: ['test2'] };

const WC_URI = 'wc:1f12611ce3fb892fc4ecf3ca842e6d33d59a91c96dce38ab75b4b0e4a1a7de84@2?expiryTimestamp=1732043830&relay-protocol=irn&symKey=1e51dca72ece64c8725fe5372d410f32459156be233c05f52063cfad3971067c';
const WC_URI_WITH_PROPOSAL = `${WC_URI}&org.rpcpeering.proposal=${encodeURIComponent(WalletConnectURIInterop.utils.base64UrlEncode(JSON.stringify(PROPOSAL)))}`;

describe('includesProposal', () => {
  it('should return true if the WC URI includes a peering proposal', () => {
    expect(WalletConnectURIInterop.includesProposal(WC_URI_WITH_PROPOSAL)).toBe(true);
  });

  it('should return false if the WC URI does not include a peering proposal', () => {
    expect(WalletConnectURIInterop.includesProposal(WC_URI)).toBe(false);
  });
});

describe('upgradeWCUri', () => {
  it('should upgrade a WC URI to a peering URI', () => {
    const upgraded = WalletConnectURIInterop.upgrade(WC_URI, PROPOSAL);
    expect(upgraded).toEqual(WC_URI_WITH_PROPOSAL);
  });
});

describe('parseUpgradeWCUri', () => {
  it('should parse a peering URI from a WC URI', () => {
    const parsed = WalletConnectURIInterop.parse(WC_URI_WITH_PROPOSAL);
    expect(parsed).toEqual(PROPOSAL);
  });
});
