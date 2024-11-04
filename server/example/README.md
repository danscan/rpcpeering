# Server SDK Example

This example demonstrates how to use the server SDK. 

`run-initiator-server.ts` runs an example Initiator server.
`run-responder-server.ts` runs a very basic responder for testing.

## Running tests

From this directory, run the following commands. You'll need [hurl](https://hurl.dev/docs/installation.html) installed to run the tests, and [bun](https://bun.sh/docs/installation) to run the example.

```
bun run main.ts
hurl --test --verbose tests.hurl
```
