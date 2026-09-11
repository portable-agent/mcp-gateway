export type CallErrorCode = 'CONNECTOR_NOT_ALLOWED' | 'TOOL_NOT_ALLOWED' | 'MCP_CALL_FAILED';

export class CallError extends Error {
    public constructor(
        public readonly code: CallErrorCode,
        message: string,
        options?: ErrorOptions,
    ) {
        super(message, options);
        this.name = 'CallError';
    }
}
