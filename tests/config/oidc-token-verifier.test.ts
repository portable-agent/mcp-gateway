import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';

import { TokenError } from '../../src/model/token-error.js';
import { OidcTokenVerifier } from '../../src/config/oidc-token-verifier.js';

const issuer = 'https://id.example.test/realms/portable-agent';
const audience = 'mcp-gateway';
const tenantId = '7d2ab493-3fa7-4ca1-b384-af9744fd6016';

describe('OidcTokenVerifier', () => {
    let privateKey: CryptoKey;
    let keySet: ReturnType<typeof createLocalJWKSet>;

    beforeAll(async () => {
        const keys = await generateKeyPair('RS256');
        privateKey = keys.privateKey;
        const publicJwk = await exportJWK(keys.publicKey);
        keySet = createLocalJWKSet({ keys: [{ ...publicJwk, kid: 'test-key', alg: 'RS256' }] });
    });

    it('verify_withValidToken_shouldReturnTenant', async () => {
        const verifier = new OidcTokenVerifier(
            { issuer, audience, requiredScope: 'mcp:call', jwksUrl: 'https://unused.test/jwks' },
            keySet,
        );
        const token = await signToken({ tenant_id: tenantId, scope: 'mcp:call calendar:write' });

        await expect(verifier.verify(token)).resolves.toEqual({ tenantId });
    });

    it('verify_withoutScope_shouldRejectToken', async () => {
        const verifier = new OidcTokenVerifier(
            { issuer, audience, requiredScope: 'mcp:call', jwksUrl: 'https://unused.test/jwks' },
            keySet,
        );
        const token = await signToken({ tenant_id: tenantId, scope: 'calendar:write' });

        await expect(verifier.verify(token)).rejects.toEqual(new TokenError('Token is not allowed'));
    });

    it('verify_withInvalidTenant_shouldRejectToken', async () => {
        const verifier = new OidcTokenVerifier(
            { issuer, audience, requiredScope: 'mcp:call', jwksUrl: 'https://unused.test/jwks' },
            keySet,
        );
        const token = await signToken({ tenant_id: 'wrong', scope: 'mcp:call' });

        await expect(verifier.verify(token)).rejects.toEqual(new TokenError('Token is not allowed'));
    });

    async function signToken(claims: Record<string, unknown>): Promise<string> {
        return new SignJWT(claims)
            .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
            .setIssuer(issuer)
            .setAudience(audience)
            .setSubject('worker')
            .setIssuedAt()
            .setExpirationTime('5m')
            .sign(privateKey);
    }
});
