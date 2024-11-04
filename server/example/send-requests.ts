import { PeeringURI } from "../../src/PeeringURI";

const RESPONDER_URL = 'http://localhost:3001';
const PEERING_URI = new PeeringURI('http://localhost:3000', 'session-id-123');

//
// User opens peering URI in their choice of responder app
//
console.log('User opens peering URI in their choice of responder app. URI:', PEERING_URI.toString());

//
// Create peering session
//
console.log('Responder is about to create a peering session with initiator');
const peerSessionRes = await fetch(PEERING_URI.url, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'danscanrpc-peering@v1_peerSession',
    params: [PEERING_URI.sessionId, RESPONDER_URL],
    id: 1,
  }),
});
const { result: sessionCreated } = await peerSessionRes.json();
if (peerSessionRes.status !== 200) throw new Error('Failed to peer create session');
if (!sessionCreated) throw new Error('Failed to create session');
const SESSION_URI = `${PEERING_URI.url}/${PEERING_URI.sessionId}`;
console.log('Session established. Initiator relay has notified initiator client of the session URI:', SESSION_URI);


//
// Send request from initiator client to responder peer
//
console.log('Initiator client is about to send a greet request to responder peer via the session URI');
const greetRes = await fetch(SESSION_URI, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'greet',
    params: ['World'],
    id: 2,
  }),
});
const greetResBody = await greetRes.json();
if (greetRes.status !== 200) throw new Error('Failed to send request to session responder');
if (greetResBody.result !== 'Hello, World!') throw new Error('Unexpected greet result');
console.log('Initiator client received response from responder:', greetResBody.result);

//
// Send batch request to from initiator to responder
//
console.log('Initiator client is about to send a batch of greet requests to responder peer via the session URI');
const batchGreetRes = await fetch(SESSION_URI, {
  method: 'POST',
  body: JSON.stringify([
    { jsonrpc: '2.0', method: 'greet', params: ['Dan'], id: 3 },
    { jsonrpc: '2.0', method: 'greet', params: ['Andrea'], id: 4 },
  ]),
});
const batchGreetResBody = await batchGreetRes.json();
console.log('Initiator client received responses from responder:', batchGreetResBody);
if (batchGreetRes.status !== 200) throw new Error('Failed to send batch request to session responder');
if (batchGreetResBody[0].result !== 'Hello, Dan!') throw new Error('Unexpected batch greet result');
if (batchGreetResBody[1].result !== 'Hello, Andrea!') throw new Error('Unexpected batch greet result');


//
// Send request from responder peer to initiator relay
//
console.log('Responder peer is about to send a request to initiator relay via the peering URI');
const getSessionResponderPeerUrlRes = await fetch(PEERING_URI.url, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'example_getSessionResponderPeerUrl',
    params: [PEERING_URI.sessionId],
    id: 5,
  }),
});
const getSessionResponderPeerUrlResBody = await getSessionResponderPeerUrlRes.json();
console.log('Responder peer received response from initiator relay:', getSessionResponderPeerUrlResBody.result);
if (getSessionResponderPeerUrlRes.status !== 200) throw new Error('Failed to send request to session initiator');
if (getSessionResponderPeerUrlResBody.result !== RESPONDER_URL) throw new Error('Unexpected getSessionResponderPeerUrl result');

//
// Send close session request from responder peer to initiator relay
//
console.log('Responder peer is about to close the peering session');
const closeSessionRes = await fetch(PEERING_URI.url, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'danscanrpc-peering@v1_closeSession',
    params: [PEERING_URI.sessionId],
    id: 6,
  }),
});
const closeSessionResBody = await closeSessionRes.json();
console.log('Responder peer received response from initiator relay:', closeSessionResBody.result);
if (closeSessionRes.status !== 200) throw new Error('Failed to close session');
if (!closeSessionResBody.result) throw new Error('Failed to close session');
console.log('Peering session closed');

//
// Future requests from initiator client to responder peer will fail because the session is not found
//
console.log('Future requests from initiator client to responder peer will fail because the session is not found');
console.log('Initiator client is about to try to send a greet request to disconnected responder peer via the session URI');
const closedSessionGreetRes = await fetch(SESSION_URI, {
  method: 'POST',
  body: JSON.stringify({ jsonrpc: '2.0', method: 'greet', params: ['World'], id: 7 }),
});
if (closedSessionGreetRes.status !== 404) throw new Error('Unexpected future greet response status');
const closedSessionGreetResBody = await closedSessionGreetRes.json();
if (closedSessionGreetResBody.error.code !== 'SESSION_NOT_FOUND') throw new Error('Unexpected future greet response');
console.log('Initiator client received expected error from disconnected responder peer:', closedSessionGreetResBody);
