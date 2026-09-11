import { HttpMcpCaller } from './client/http-mcp-caller.js';
import { OidcTokenVerifier } from './config/oidc-token-verifier.js';
import { readSettings } from './config/settings.js';
import { createApp } from './controller/app.js';
import { CallService } from './service/call-service.js';

const settings = readSettings(process.env);
const caller = new HttpMcpCaller();
const callService = new CallService(settings.connectors, caller, settings.callTimeoutMs);
const tokenVerifier = new OidcTokenVerifier(settings.oidc);
const app = createApp({ callUseCase: callService, tokenVerifier });

try {
    await app.listen({ host: settings.host, port: settings.port });
} catch (error) {
    app.log.error({ err: error }, 'Cannot start MCP Gateway');
    process.exitCode = 1;
}
