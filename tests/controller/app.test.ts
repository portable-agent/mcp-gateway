import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TokenVerifier } from '../../src/config/oidc-token-verifier.js';
import { createApp } from '../../src/controller/app.js';
import { CallError } from '../../src/model/call-error.js';
import type { CallUseCase } from '../../src/service/call-service.js';

const body = {
    actionId: '5d41fba4-b49f-413f-9cb8-17a03e2147b6',
    connector: 'fake-calendar',
    tool: 'create_event',
    input: { title: 'Demo' },
    requestKey: 'request-123',
};

describe('createApp', () => {
    const apps: Array<ReturnType<typeof createApp>> = [];

    afterEach(async () => {
        await Promise.all(apps.splice(0).map((app) => app.close()));
    });

    it('health_shouldReturnReadyState', async () => {
        const app = appWith();

        const response = await app.inject({ method: 'GET', url: '/health' });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ status: 'ok' });
    });

    it('call_withValidRequest_shouldVerifyAndCallService', async () => {
        const call = vi.fn().mockResolvedValue({ data: { eventId: 'event-123' } });
        const verify = vi.fn().mockResolvedValue({ tenantId: '7d2ab493-3fa7-4ca1-b384-af9744fd6016' });
        const app = appWith({ call }, { verify });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/calls',
            headers: { authorization: 'Bearer test-token' },
            payload: body,
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ data: { eventId: 'event-123' } });
        expect(verify).toHaveBeenCalledWith('test-token');
        expect(call).toHaveBeenCalledWith(body, 'Bearer test-token');
    });

    it('call_withoutToken_shouldReturn401', async () => {
        const app = appWith();

        const response = await app.inject({ method: 'POST', url: '/api/v1/calls', payload: body });

        expect(response.statusCode).toBe(401);
        expect(response.json()).toMatchObject({
            type: 'https://portable-agent.dev/problems/not-authenticated',
            status: 401,
        });
    });

    it('call_withInvalidBody_shouldReturn400', async () => {
        const app = appWith();

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/calls',
            headers: { authorization: 'Bearer test-token' },
            payload: {},
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
            type: 'https://portable-agent.dev/problems/validation-failed',
            status: 400,
        });
    });

    it('call_whenRouteIsBlocked_shouldReturn403', async () => {
        const call = vi.fn().mockRejectedValue(new CallError('TOOL_NOT_ALLOWED', 'Tool is not allowed'));
        const app = appWith({ call });

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/calls',
            headers: { authorization: 'Bearer test-token' },
            payload: body,
        });

        expect(response.statusCode).toBe(403);
        expect(response.json()).toMatchObject({
            type: 'https://portable-agent.dev/problems/call-not-allowed',
            status: 403,
        });
    });

    function appWith(
        callUseCase: CallUseCase = { call: vi.fn().mockResolvedValue({}) },
        tokenVerifier: TokenVerifier = {
            verify: vi.fn().mockResolvedValue({ tenantId: '7d2ab493-3fa7-4ca1-b384-af9744fd6016' }),
        },
    ) {
        const app = createApp({ callUseCase, tokenVerifier, logger: false });
        apps.push(app);
        return app;
    }
});
