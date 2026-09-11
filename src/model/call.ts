export type CallRequest = {
    actionId: string;
    connector: string;
    tool: string;
    input: Record<string, unknown>;
    requestKey: string;
};

export type CallResult = {
    data?: Record<string, unknown>;
    content?: unknown[];
};
