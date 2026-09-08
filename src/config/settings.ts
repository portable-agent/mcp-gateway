import { z } from 'zod';

const connectorSchema = z.object({
    name: z.string().min(1),
    url: z.url(),
    tools: z.array(z.string().min(1)).min(1),
    scope: z.string().min(1),
});

const connectorsSchema = z
    .array(connectorSchema)
    .min(1)
    .superRefine((connectors, context) => {
        const names = new Set<string>();

        for (const connector of connectors) {
            if (names.has(connector.name)) {
                context.addIssue({
                    code: 'custom',
                    message: 'Connector names must be unique',
                });
            }
            names.add(connector.name);
        }
    });

const settingsSchema = z.object({
    HOST: z.string().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
    CALL_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    MCP_CONNECTORS_JSON: z.string().min(1),
});

export type ConnectorSettings = z.infer<typeof connectorSchema>;

export type Settings = {
    host: string;
    port: number;
    callTimeoutMs: number;
    connectors: ConnectorSettings[];
};

export function readSettings(env: NodeJS.ProcessEnv): Settings {
    const values = settingsSchema.parse(env);
    let rawConnectors: unknown;

    try {
        rawConnectors = JSON.parse(values.MCP_CONNECTORS_JSON);
    } catch (error) {
        throw new Error('MCP_CONNECTORS_JSON must contain valid JSON', { cause: error });
    }

    return {
        host: values.HOST,
        port: values.PORT,
        callTimeoutMs: values.CALL_TIMEOUT_MS,
        connectors: connectorsSchema.parse(rawConnectors),
    };
}
