import type { z } from 'zod';
import { JSONRPC2Error } from './JSONRPC2Error';
import {
  type JSONRPCRequest,
  type JSONRPCResponse,
  type JSONRPCResponseBatch,
  JSONRPCRequestBatchSchema,
  JSONRPCRequestSchema,
  JSONRPCResponseBatchSchema,
  JSONRPCResponseSchema
} from './JSONRPC2Schemas';

// Base type for all method handlers
type BaseMethodHandler<TParams, TResult> = {
  paramsSchema: z.ZodType<TParams>;
  handler: (params: TParams) => Promise<TResult>;
};

// Regular RPC method that returns a result
type RPCMethodHandler<TParams, TResult> = BaseMethodHandler<TParams, TResult> & {
  resultSchema: z.ZodType<TResult>;
  type?: never;
};

// Notification method that doesn't return a result
type NotificationMethodHandler<TParams> = BaseMethodHandler<TParams, void> & {
  type: 'notification';
  resultSchema?: never;
};

// Union type for both method types
export type MethodHandler<
  TParams extends z.AnyZodObject | z.AnyZodTuple,
  TResult extends z.ZodSchema
> = RPCMethodHandler<z.infer<TParams>, z.infer<TResult>> | NotificationMethodHandler<z.infer<TParams>>;

// Type for the methods object passed to Server
export type Methods = Record<string, MethodHandler<any, any>>;

export class Server<TMethods extends Methods> {
  constructor(private readonly methods: TMethods) {}

  async handle(
    request: Record<string, unknown> | Record<string, unknown>[]
  ): Promise<JSONRPCResponse | JSONRPCResponseBatch | void> {
    // Handle batch requests
    const batchParseResult = JSONRPCRequestBatchSchema.safeParse(request);
    if (batchParseResult.success) {
      const responses = await Promise.all(
        batchParseResult.data.map(req => this.handleMethodRequest(req))
      );
      // Filter out notification responses (undefined)
      return JSONRPCResponseBatchSchema.parse(responses.filter((r): r is JSONRPCResponse => r !== undefined));
    }

    // Handle single request
    const singleParseResult = JSONRPCRequestSchema.safeParse(request);
    if (singleParseResult.success) {
      return this.handleMethodRequest(singleParseResult.data);
    }

    // Invalid request
    return JSONRPCResponseSchema.parse({
      jsonrpc: '2.0',
      error: JSONRPC2Error.InvalidRequest,
      id: 'id' in request ? request.id : null,
    });
  }

  private async handleMethodRequest(request: JSONRPCRequest): Promise<JSONRPCResponse | void> {
    const method = this.methods[request.method];
    if (!method) {
      return JSONRPCResponseSchema.parse({
        jsonrpc: '2.0',
        error: JSONRPC2Error.MethodNotFoundWithData({ method: request.method }),
        id: request.id,
      });
    }

    const paramsResult = method.paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      return JSONRPCResponseSchema.parse({
        jsonrpc: '2.0',
        error: JSONRPC2Error.InvalidParams,
        id: request.id,
      });
    }

    return this.callMethod(method, request.id, paramsResult.data);
  }

  private async callMethod<TMethod extends MethodHandler<any, any>>(
    method: TMethod,
    id: JSONRPCRequest['id'],
    params: z.infer<TMethod['paramsSchema']>
  ): Promise<JSONRPCResponse | void> {
    const isNotification = 'type' in method && method.type === 'notification';

    try {
      const result = await method.handler(params);
      if (isNotification) return;

      return JSONRPCResponseSchema.parse({
        jsonrpc: '2.0',
        result,
        id,
      });
    } catch (error) {
      if (isNotification) return;

      return JSONRPCResponseSchema.parse({
        jsonrpc: '2.0',
        error: error instanceof JSONRPC2Error 
          ? error 
          : JSONRPC2Error.InternalErrorWithData(error),
        id,
      });
    }
  }
}

