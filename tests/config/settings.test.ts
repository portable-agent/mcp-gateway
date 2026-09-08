import { describe, expect, it } from 'vitest';

import { readSettings } from '../../src/config/settings.js';

describe('readSettings', () => {
    it('readSettings_withValidRoutes_shouldReturnSettings', () => {
        const settings = readSettings({
            MCP_CONNECTORS_JSON: JSON.stringify([
                {
                    name: 'fake-calendar',
                    url: 'http://calendar-mcp:8080/mcp',
                    tools: ['create_event'],
                    scope: 'calendar:write',
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
                scope: 'calendar:write',
            },
        ]);
    });

    it('readSettings_withoutRoutes_shouldRejectStart', () => {
        expect(() => readSettings({})).toThrow('MCP_CONNECTORS_JSON');
    });

    it('readSettings_withDuplicateNames_shouldRejectStart', () => {
        const route = {
            name: 'fake-calendar',
            url: 'http://calendar-mcp:8080/mcp',
            tools: ['create_event'],
            scope: 'calendar:write',
        };

        expect(() =>
            readSettings({
                MCP_CONNECTORS_JSON: JSON.stringify([route, route]),
            }),
        ).toThrow('unique');
    });
});
