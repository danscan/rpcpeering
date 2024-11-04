# Create session
POST http://localhost:3000
{
  "jsonrpc": "2.0",
  "method": "danscanrpc-peering@v1_peerSession",
  "params": ["123", "http://localhost:3001"],
  "id": 1
}

HTTP 200

[Asserts]
jsonpath "$.result" == true


# Send request to session responder
POST http://localhost:3000/123
{
  "jsonrpc": "2.0",
  "method": "greet",
  "params": ["World"],
  "id": 2
}

HTTP 200

[Asserts]
jsonpath "$.result" == "Hello, World!"

# Send request to session responder
POST http://localhost:3000/123
[{
  "jsonrpc": "2.0",
  "method": "greet",
  "params": ["Dan"],
  "id": 3
}, {
  "jsonrpc": "2.0",
  "method": "greet",
  "params": ["Andrea"],
  "id": 4
}]

HTTP 200

[Asserts]
jsonpath "$[0].result" == "Hello, Dan!"
jsonpath "$[1].result" == "Hello, Andrea!"

# Send request to session initiator
POST http://localhost:3000
{
  "jsonrpc": "2.0",
  "method": "example_getSessionResponderPeerUrl",
  "params": ["123"],
  "id": 5
}

HTTP 200

[Asserts]
jsonpath "$.result" == "http://localhost:3001"
