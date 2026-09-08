import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

import { CallError } from '../model/call-error.js';
import type { CallResult } from '../model/call.js';
import type { McpCall, McpCaller } from './mcp-caller.js';

type McpToolResult = {
    isError?: boolean | undefined;
    structuredContent?: unknown;
    content?: unknown[] | undefined;
};

export interface McpSession {
    callTool(this: void, tool: string, input: Record<string, unknown>, timeoutMs: number): Promise<McpToolResult>;
    close(this: void): Promise<void>;
}

export type McpSessionFactory = (request: McpCall) => Promise<McpSession>;

export class HttpMcpCaller implements McpCaller {
    public constructor(private readonly openSession: McpSessionFactory = createMcpSession) {}

    public async call(request: McpCall): Promise<CallResult> {
        let session: McpSession | undefined;

        try {
            session = await this.openSession(request);
            const result = await session.callTool(request.tool, request.input, request.timeoutMs);

            if (result.isError === true) {
                throw new CallError('MCP_CALL_FAILED', 'MCP tool returned an error');
            }

            const response: CallResult = {};
            if (isRecord(result.structuredContent)) {
                response.data = result.structuredContent;
            }
            if (result.content !== undefined) {
                response.content = result.content;
            }
            return response;
        } catch (error) {
            if (error instanceof CallError) {
                throw error;
            }
            throw new CallError('MCP_CALL_FAILED', 'MCP call failed', { cause: error });
        } finally {
            await session?.close();
        }
    }
}

async function createMcpSession(request: McpCall): Promise<McpSession> {
    const token = request.token.replace(/^Bearer\s+/i, '');
    const client = new Client(
        { name: 'portable-agent-mcp-gateway', version: '0.1.0' },
        { versionNegotiation: { mode: 'auto' } },
    );
    const transport = new StreamableHTTPClientTransport(new URL(request.url), {
        authProvider: { token: () => Promise.resolve(token) },
        onInsufficientScope: 'throw',
    });
    await client.connect(transport);

    return {
        callTool(tool, input, timeoutMs) {
            return client.callTool(
                {
                    name: tool,
                    arguments: input,
                },
                {
                    timeout: timeoutMs,
                    maxTotalTimeout: timeoutMs,
                },
            );
        },
        close: () => client.close(),
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
