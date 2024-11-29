# RPC Peering

RPC Peering is a user-centric app interoperation protocol.

It allows an app (the *initiator*) to request a user to connect it to another app (the *responder*) that supports the required RPC interface.

For example:
- A Web3 app can request the user to connect it to a Wallet app that supports the Ethereum JSON-RPC API interface.
- A note taking app can request to connect to an LLM that supports the Ollama HTTP API interface.
- An AI chat bot app can request to connect to some upstream app that supports a certain GRPC API interface.


## How It Works

Let's assume the initiator app is a crypto portfolio tracker and it wants to connect to a responder app that supports the Ethereum JSON-RPC API.

1. The initiator app creates a Peering URI with the topic `ethereum` and its peering server URL.

```typescript
import { PeeringURI } from 'rpcpeering';

// Create a peering URI that will tell the responder app to connect to the initiator's peering server
const peeringUri = new PeeringURI(
  'https://portfolio-tracker.example.com/rpcpeering', // The URL of the initiator's peering server
  'ethereum', // The topic the responder app must support
);
// The peering URI string is:
// `rpcpeering+ethereum:${encodeURIComponent('https://portfolio-tracker.example.com/rpcpeering')}`

// Display the peering URI to the user in a QR code so they can scan it with their waller app
```

2. The user scans the QR code with their wallet app, which opens the peering URI in the responder wallet app. The wallet app sends a session proposal to the initiator's peering server.

```json
{
  "url": "https://wallet.example.com/rpcpeering/ethereum", // The URL of the responder's Ethereum JSON-RPC API
  "advertise": ["ethereum", "solana"], // The topics the responder app supports. Here, the responder advertises to the tracker app that it also supports the Solana JSON-RPC API.
}
```

3. The initiator's peering server evaluates the session proposal. If the proposal is accepted, the initiator sends its own session proposal to the responder's peering server.

```json
{
  "url": "https://portfolio-tracker.example.com/rpcpeering/ethereum", // The URL of the initiator's Ethereum callback API, where the responder can send callback requests
  "advertise": ["ethereum", "solana"], // The topics the initiator app supports. Here, the initiator advertises to the wallet app that it also supports the Solana JSON-RPC API.
}
```

4. The initiator and responder can now send Ethereum JSON-RPC requests to each other over the URLs specified in their session proposals.