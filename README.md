# RPC Peering

RPC Peering is a user-centric app interoperation protocol.

It allows an app (the *initiator*) to request a user to connect it to another app (the *responder*) that supports the required RPC interface.

For example:
- A Web3 app can request the user to connect it to a Wallet app that supports the Ethereum JSON-RPC API interface.
- A note taking app can request to connect to an LLM that supports the Ollama HTTP API interface.
- An AI chat bot app can request to connect to some upstream app that supports a certain GRPC API interface.


## How it works

RPC Peering is a JSON-RPC over HTTP protocol, but that constraint is limited to the session proposal and response phases.

When a session is established, the initiator and responder exchange session URLs where they send requests to each other. Those URLs can use any protocol, as specified by the session _topic_.

### Session Proposal

1. The initiator creates a session proposal URI with the topic it requests of the responder and the URL of its peering server.
2. The initiator presents the session proposal URI to the user, for example by displaying it in a QR code.
3. The user opens the URI in the responder app of their choosing.
4. The responder app sends a session proposal to the initiator's peering server, including the responder's proposed session URL, the session topic, and an array of other topics it wishes to advertise its support for.
5. The initiator's peering server evaluates the session proposal. If the proposal is accepted, the initiator sends its own session proposal to the responder's peering server.
6. The responder's peering server evaluates the session proposal. If the proposal is accepted, the initiator and responder can begin communicating over the URLs exchanged in their session proposals.
7. Communication between the initiator and responder apps is protocol agnostic. They can use any transport or message protocol allowed by their topics.
