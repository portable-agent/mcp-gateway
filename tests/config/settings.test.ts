import { describe, expect, it } from 'vitest';

import { readSettings } from '../../src/config/settings.js';

describe('readSettings', () => {
    it('readSettings_withValidRoutes_shouldReturnSettings', () => {
        const settings = readSettings({
            OIDC_ISSUER: 'http://keycloak:8080/realms/portable-agent',
            OIDC_JWKS_URL: 'http://keycloak:8080/realms/portable-agent/protocol/openid-connect/certs',
            OIDC_AUDIENCE: 'mcp-gateway',
            OIDC_REQUIRED_SCOPE: 'mcp:call',
            MCP_CONNECTORS_JSON: JSON.stringify([
                {
                    name: 'fake-calendar',
                    url: 'http://calendar-mcp:8080/mcp',
                    tools: ['create_event'],
                },
            ]),
        });

        expect(settings.port).toBe(8080);
        expect(settings.callTimeoutMs).toBe(10_000);
        expect(settings.connectors).toEqual([
            {
                name: 'fake-calendar',
                url: 'http://calendar-mcp:8080/mcp',
                tools: ['create_event'],
            },
        ]);
        expect(settings.oidc).toEqual({
            issuer: 'http://keycloak:8080/realms/portable-agent',
            jwksUrl: 'http://keycloak:8080/realms/portable-agent/protocol/openid-connect/certs',
            audience: 'mcp-gateway',
            requiredScope: 'mcp:call',
        });
    });

    it('readSettings_withoutRoutes_shouldRejectStart', () => {
        expect(() => readSettings({})).toThrow('MCP_CONNECTORS_JSON');
    });

    it('readSettings_withDuplicateNames_shouldRejectStart', () => {
        const route = {
            name: 'fake-calendar',
            url: 'http://calendar-mcp:8080/mcp',
            tools: ['create_event'],
        };

        expect(() =>
            readSettings({
                OIDC_ISSUER: 'http://keycloak:8080/realms/portable-agent',
                OIDC_JWKS_URL: 'http://keycloak:8080/realms/portable-agent/protocol/openid-connect/certs',
                OIDC_AUDIENCE: 'mcp-gateway',
                OIDC_REQUIRED_SCOPE: 'mcp:call',
                MCP_CONNECTORS_JSON: JSON.stringify([route, route]),
            }),
        ).toThrow('unique');
    });
});
