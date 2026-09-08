import type { CallResult } from '../model/call.js';

export type McpCall = {
    url: string;
    tool: string;
    input: Record<string, unknown>;
    token: string;
    timeoutMs: number;
};

export interface McpCaller {
    call(request: McpCall): Promise<CallResult>;
}
