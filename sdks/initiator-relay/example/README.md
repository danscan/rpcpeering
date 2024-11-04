# Initiator Relay Example

This example demonstrates how to use the Initiator Relay SDK. 

`run-initiator-relay.ts` runs an example Initiator Relay server.
`run-responder-stub.ts` runs a very basic responder for testing.

## Running tests

From this directory, run the following commands. You'll need [hurl](https://hurl.dev/docs/installation.html) installed to run the tests, and [bun](https://bun.sh/docs/installation) to run the example.

```
bun run main.ts
hurl --test --verbose tests.hurl
```
