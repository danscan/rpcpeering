import { describe, expect, it, mock } from 'bun:test';
import { createPeeringClient } from './PeeringClient';
import { createPeeringServer } from './PeeringServer';
import { PeeringSessionProposalSchema } from './PeeringSessionProposal';

const SERVER_PROPOSAL = PeeringSessionProposalSchema.parse({
  topic: 'test',
  url: 'https://server.example.com/rpcpeering',
  advertise: ['test2'],
});

const CLIENT_PROPOSAL = PeeringSessionProposalSchema.parse({
  topic: 'test',
  url: 'https://client.example.com/rpcpeering',
  advertise: ['test2'],
});

describe('createPeeringServer', () => {
  it('should create a peering server', async () => {
    // Mock server callbacks
    const onPeerConnected = mock(async (remotePeerSessionUrl: string) => {});
    const onPeerDisconnected = mock(async () => {});
    const onRequestSessionProposal = mock(async () => SERVER_PROPOSAL);
    // Create the peering server
    const peeringServer = createPeeringServer({
      onPeerConnected,
      onPeerDisconnected,
      onRequestSessionProposal,
    });
    // Create a JSON-RPC client for the peering server
    const peeringJsonRpcClient = peeringServer.createClient((req) => peeringServer.request(req));

    // Send a peer request from the client to the server
    const peerResponse = await peeringJsonRpcClient['rpcpeering1/peer'](CLIENT_PROPOSAL);

    // Check that the server's `onRequestSessionProposal` callback was called
    expect(onRequestSessionProposal).toHaveBeenCalled();

    // Check that the peer response is correct
    expect(peerResponse).toMatchObject({
      accepted: true,
      proposal: SERVER_PROPOSAL,
    });

    // Check that the `onPeerConnected` callback was called
    expect(onPeerConnected).toHaveBeenCalledWith(CLIENT_PROPOSAL.url);

    // Disconnect the client from the server
    // NOTE: The response is void, so as long as it doesn't throw, we're good
    await peeringJsonRpcClient['rpcpeering1/disconnect']();

    // Check that the `onPeerDisconnected` callback was called
    expect(onPeerDisconnected).toHaveBeenCalled();
  });
});

describe('createPeeringClient', () => {
  it('should create a peering client', async () => {
    // Create the peering server
    const peeringServer = createPeeringServer({
      onPeerConnected: async () => {},
      onPeerDisconnected: async () => {},
      onRequestSessionProposal: async () => SERVER_PROPOSAL,
    });

    // Create the peering client
    const peeringClient = createPeeringClient((req) => peeringServer.request(req));

    // Peer with the server
    const serverProposal = await peeringClient.peer(CLIENT_PROPOSAL);
    // Check that the server proposal is correct
    expect(serverProposal).toMatchObject(SERVER_PROPOSAL);

    // Disconnect from the server
    await peeringClient.disconnect();
  });
});
