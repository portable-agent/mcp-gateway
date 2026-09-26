import { describe, expect, it, vi } from 'vitest';

import type { McpCaller } from '../../src/client/mcp-caller.js';
import { CallError } from '../../src/model/call-error.js';
import { CallService } from '../../src/service/call-service.js';

const request = {
    actionId: '5d41fba4-b49f-413f-9cb8-17a03e2147b6',
    connector: 'fake-calendar',
    tool: 'create_event',
    input: { title: 'Demo', actor_id: 'untrusted-value' },
    requestKey: 'request-123',
    context: { actorId: '28efc74e-e82b-4ea2-9143-4dc24c13fe0d' },
};

describe('CallService', () => {
    it('call_withAllowedRoute_shouldCallMcp', async () => {
        const caller: McpCaller = {
            call: vi.fn().mockResolvedValue({ data: { eventId: 'event-123' } }),
        };
        const service = new CallService(
            [
                {
                    name: 'fake-calendar',
                    url: 'http://calendar-mcp:8080/mcp',
                    tools: ['create_event'],
                },
            ],
            caller,
        );

        const result = await service.call(request, 'Bearer test-token');

        expect(result).toEqual({ data: { eventId: 'event-123' } });
        expect(vi.mocked(caller.call)).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'http://calendar-mcp:8080/mcp',
                tool: 'create_event',
                token: 'Bearer test-token',
                input: {
                    title: 'Demo',
                    request_key: 'request-123',
                    actor_id: '28efc74e-e82b-4ea2-9143-4dc24c13fe0d',
                },
            }),
        );
    });

    it('call_withoutContext_shouldKeepFakeConnectorCompatible', async () => {
        const caller: McpCaller = { call: vi.fn().mockResolvedValue({}) };
        const service = new CallService(
            [
                {
                    name: 'fake-calendar',
                    url: 'http://calendar-mcp:8080/mcp',
                    tools: ['create_event'],
                },
            ],
            caller,
        );

        await service.call({ ...request, context: undefined, input: { title: 'Demo' } }, 'Bearer test-token');

        expect(vi.mocked(caller.call)).toHaveBeenCalledWith(
            expect.objectContaining({
                input: { title: 'Demo', request_key: 'request-123' },
            }),
        );
    });

    it('call_withUnknownConnector_shouldRejectCall', async () => {
        const caller: McpCaller = { call: vi.fn() };
        const service = new CallService([], caller);

        await expect(service.call(request, 'Bearer test-token')).rejects.toEqual(
            new CallError('CONNECTOR_NOT_ALLOWED', 'Connector is not allowed'),
        );
    });

    it('call_withUnknownTool_shouldRejectCall', async () => {
        const caller: McpCaller = { call: vi.fn() };
        const service = new CallService(
            [
                {
                    name: 'fake-calendar',
                    url: 'http://calendar-mcp:8080/mcp',
                    tools: ['list_events'],
                },
            ],
            caller,
        );

        await expect(service.call(request, 'Bearer test-token')).rejects.toEqual(
            new CallError('TOOL_NOT_ALLOWED', 'Tool is not allowed'),
        );
    });
});
