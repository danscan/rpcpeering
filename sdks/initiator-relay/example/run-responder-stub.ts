const server = Bun.serve({
  async fetch(req) {
    const body = await req.json();
    console.log('ResponderRelay', 'TODO: Handle RPC for session', req.headers.get('X-Session-Id'), 'with json body', body);
    return Response.json({
      jsonrpc: '2.0',
      id: body.id,
      method: body.method,
      result: {
        note: 'This is a placeholder response. The remote RPC is not yet implemented.',
        originalBody: body,
      },
    });
  },
});

console.log('ResponderRelay', `Listening on ${server.url}`);