import { describe, expect, it, mock } from 'bun:test';
import { PeeringURI } from './PeeringURI';

const TEST_URI = 'rpcpeering+test:https%3A%2F%2Finitiator.example.com%2Frpcpeering';
const TEST_URI_PEER_URL = 'https://initiator.example.com/rpcpeering';

describe('PeeringURI', () => {
  it('should construct a peering URI', () => {
    const peeringUri = new PeeringURI(TEST_URI_PEER_URL, 'test');
    expect(peeringUri.toString()).toBe(TEST_URI);
    expect(peeringUri.url).toBeInstanceOf(URL);
    expect(peeringUri.url.toString()).toBe(TEST_URI_PEER_URL);
    expect(peeringUri.topic).toBe('test');
    expect(peeringUri.toString()).toBe(TEST_URI);
  });

  it('should parse a peering URI', () => {
    const peeringUri = PeeringURI.fromString(TEST_URI);
    expect(peeringUri).toBeInstanceOf(PeeringURI);
    expect(peeringUri.url).toBeInstanceOf(URL);
    expect(peeringUri.url.toString()).toBe(TEST_URI_PEER_URL);
    expect(peeringUri.topic).toBe('test');
    expect(peeringUri.toString()).toBe(TEST_URI);
  });

  it('should open a peering URI', async () => {
    const sendRequest = mock(async (serverUrl: URL, request: Record<string, any>) => ({
      jsonrpc: '2.0',
      result: {
        accepted: true,
        proposal: { topic: 'test', url: TEST_URI_PEER_URL, advertise: [] },
      },
      id: 1,
    }));

    const { peerProposal, disconnect } = await PeeringURI.fromString(TEST_URI).open(sendRequest, { url: 'https://responder.example.com/rpcpeering', advertise: [] });
    expect(peerProposal).toMatchObject({ topic: 'test', url: TEST_URI_PEER_URL, advertise: [] });
    expect(disconnect).toBeInstanceOf(Function);
  });
});
