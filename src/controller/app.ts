import Fastify, { type FastifyInstance } from 'fastify';
import { z, ZodError } from 'zod';

import type { TokenVerifier } from '../config/oidc-token-verifier.js';
import { CallError } from '../model/call-error.js';
import { TokenError } from '../model/token-error.js';
import type { CallUseCase } from '../service/call-service.js';

const callSchema = z
    .object({
        actionId: z.uuid(),
        connector: z.string().min(1).max(100),
        tool: z.string().min(1).max(100),
        input: z.record(z.string(), z.unknown()),
        requestKey: z.string().min(8).max(128),
    })
    .strict();

type AppDependencies = {
    callUseCase: CallUseCase;
    tokenVerifier: TokenVerifier;
    logger?: boolean;
};

export function createApp(dependencies: AppDependencies): FastifyInstance {
    const app = Fastify({
        logger: dependencies.logger ?? true,
    });

    app.get('/health', () => ({ status: 'ok' }));

    app.post('/api/v1/calls', async (request, reply) => {
        reply.header('x-request-id', request.id);

        try {
            const token = bearerToken(request.headers.authorization);
            await dependencies.tokenVerifier.verify(token);
            const call = callSchema.parse(request.body);
            return await dependencies.callUseCase.call(call, `Bearer ${token}`);
        } catch (error) {
            if (error instanceof ZodError) {
                return problem(reply, 400, 'validation-failed', 'Validation failed');
            }
            if (error instanceof TokenError) {
                return problem(reply, 401, 'not-authenticated', 'Not authenticated');
            }
            if (error instanceof CallError) {
                if (error.code === 'CONNECTOR_NOT_ALLOWED' || error.code === 'TOOL_NOT_ALLOWED') {
                    return problem(reply, 403, 'call-not-allowed', 'Call is not allowed');
                }
                return problem(reply, 502, 'mcp-call-failed', 'MCP call failed');
            }

            request.log.error({ err: error }, 'Unexpected call error');
            return problem(reply, 500, 'internal-error', 'Internal error');
        }
    });

    return app;
}

function bearerToken(authorization: string | undefined): string {
    const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? '');
    if (match?.[1] === undefined) {
        throw new TokenError('Token is not allowed');
    }
    return match[1];
}

function problem(
    reply: { code(status: number): { send(body: unknown): unknown } },
    status: number,
    type: string,
    title: string,
) {
    return reply.code(status).send({
        type: `https://portable-agent.dev/problems/${type}`,
        title,
        status,
    });
}
