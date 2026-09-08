import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
    connect: vi.fn(),
    callTool: vi.fn(),
    close: vi.fn(),
    Client: vi.fn(),
    Transport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/client', () => ({
    Client: sdk.Client.mockImplementation(function ClientMock() {
        return {
            connect: sdk.connect,
            callTool: sdk.callTool,
            close: sdk.close,
        };
    }),
    StreamableHTTPClientTransport: sdk.Transport.mockImplementation(function TransportMock() {
        return {};
    }),
}));

import { HttpMcpCaller, type McpSession } from '../../src/client/http-mcp-caller.js';
import { CallError } from '../../src/model/call-error.js';

const request = {
    url: 'http://calendar-mcp:8080/mcp',
    tool: 'create_event',
    input: { title: 'Demo', request_key: 'request-123' },
    token: 'Bearer test-token',
    timeoutMs: 500,
};

describe('HttpMcpCaller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('call_withStructuredResult_shouldReturnDataAndClose', async () => {
        const session: McpSession = {
            callTool: vi.fn().mockResolvedValue({
                structuredContent: { eventId: 'event-123' },
                content: [],
            }),
            close: vi.fn().mockResolvedValue(undefined),
        };
        const caller = new HttpMcpCaller(vi.fn().mockResolvedValue(session));

        const result = await caller.call(request);

        expect(result).toEqual({ data: { eventId: 'event-123' }, content: [] });
        expect(vi.mocked(session.callTool)).toHaveBeenCalledWith('create_event', request.input, 500);
        expect(vi.mocked(session.close)).toHaveBeenCalledOnce();
    });

    it('call_whenToolReturnsError_shouldRejectAndClose', async () => {
        const session: McpSession = {
            callTool: vi.fn().mockResolvedValue({ isError: true, content: [] }),
            close: vi.fn().mockResolvedValue(undefined),
        };
        const caller = new HttpMcpCaller(vi.fn().mockResolvedValue(session));

        await expect(caller.call(request)).rejects.toEqual(
            new CallError('MCP_CALL_FAILED', 'MCP tool returned an error'),
        );
        expect(vi.mocked(session.close)).toHaveBeenCalledOnce();
    });

    it('call_whenTransportFails_shouldHideProviderDetails', async () => {
        const caller = new HttpMcpCaller(vi.fn().mockRejectedValue(new Error('secret provider response')));

        await expect(caller.call(request)).rejects.toEqual(
            new CallError('MCP_CALL_FAILED', 'MCP call failed', { cause: expect.any(Error) }),
        );
    });

    it('call_withDefaultClient_shouldUseOfficialSdkAndTimeout', async () => {
        sdk.connect.mockResolvedValue(undefined);
        sdk.callTool.mockResolvedValue({
            structuredContent: { eventId: 'event-123' },
            content: [],
        });
        sdk.close.mockResolvedValue(undefined);
        const caller = new HttpMcpCaller();

        const result = await caller.call(request);

        expect(result.data).toEqual({ eventId: 'event-123' });
        expect(sdk.Transport).toHaveBeenCalledWith(
            new URL(request.url),
            expect.objectContaining({ onInsufficientScope: 'throw' }),
        );
        expect(sdk.callTool).toHaveBeenCalledWith(
            { name: 'create_event', arguments: request.input },
            { timeout: 500, maxTotalTimeout: 500 },
        );
        expect(sdk.close).toHaveBeenCalledOnce();
    });
});
