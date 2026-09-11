import type { McpCaller } from '../client/mcp-caller.js';
import type { ConnectorSettings } from '../config/settings.js';
import { CallError } from '../model/call-error.js';
import type { CallRequest, CallResult } from '../model/call.js';

export interface CallUseCase {
    call(this: void, request: CallRequest, token: string): Promise<CallResult>;
}

export class CallService implements CallUseCase {
    private readonly connectors: Map<string, ConnectorSettings>;

    public constructor(
        connectors: ConnectorSettings[],
        private readonly caller: McpCaller,
        private readonly timeoutMs = 10_000,
    ) {
        this.connectors = new Map(connectors.map((connector) => [connector.name, connector]));
    }

    public async call(request: CallRequest, token: string): Promise<CallResult> {
        const connector = this.connectors.get(request.connector);
        if (connector === undefined) {
            throw new CallError('CONNECTOR_NOT_ALLOWED', 'Connector is not allowed');
        }
        if (!connector.tools.includes(request.tool)) {
            throw new CallError('TOOL_NOT_ALLOWED', 'Tool is not allowed');
        }

        return this.caller.call({
            url: connector.url,
            tool: request.tool,
            input: {
                ...request.input,
                request_key: request.requestKey,
            },
            token,
            timeoutMs: this.timeoutMs,
        });
    }
}
