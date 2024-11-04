# Create session
POST http://localhost:3000/sessions/123/ethereum,bitcoin
`http://localhost:3001`

HTTP 201


# Get session initiator
GET http://localhost:3000/sessions/123/initiator

HTTP 200

[Asserts]
jsonpath "$.protocols[0]" == "ethereum"
jsonpath "$.protocols[1]" == "danscanrpc-v1"


# Send request to session responder
POST http://localhost:3000/sessions/123/responder/requests/ethereum
{
  "jsonrpc": "2.0",
  "method": "eth_getBlockByNumber",
  "params": [
    "0x1b4",
    true
  ]
}

HTTP 200


# Send unsupported request to session responder
POST http://localhost:3000/sessions/123/responder/requests/solana
{
  "jsonrpc": "2.0",
  "method": "get_latest_block"
}

HTTP 400

[Asserts]
jsonpath "$.error" == "Unsupported protocols"


# Update session responder
POST http://localhost:3000/sessions/123/initiator/requests/danscanrpc-v1
{
  "id": 1,
  "jsonrpc": "2.0",
  "method": "set_responder",
  "params": {
    "url": "http://localhost:3001/",
    "protocols": ["ethereum", "bitcoin", "solana"]
  }
}

HTTP 200

[Asserts]
jsonpath "$.id" == 1
jsonpath "$.jsonrpc" == "2.0"
jsonpath "$.method" == "set_responder"
jsonpath "$.result" == true


# Get session responder
GET http://localhost:3000/sessions/123/responder

HTTP 200

[Asserts]
jsonpath "$.protocols[0]" == "ethereum"
jsonpath "$.protocols[1]" == "bitcoin"
jsonpath "$.protocols[2]" == "solana"


# Send request to session responder
POST http://localhost:3000/sessions/123/responder/requests/solana
{
  "jsonrpc": "2.0",
  "method": "get_latest_block"
}

HTTP 200

# Reset session responder to original value
POST http://localhost:3000/sessions/123/initiator/requests/danscanrpc-v1
{
  "id": 2,
  "jsonrpc": "2.0",
  "method": "set_responder",
  "params": {
    "url": "http://localhost:3001/",
    "protocols": ["ethereum", "bitcoin"]
  }
}

HTTP 200
