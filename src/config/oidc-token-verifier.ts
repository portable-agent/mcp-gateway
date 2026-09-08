import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

import { TokenError } from '../model/token-error.js';
import type { OidcSettings } from './settings.js';

const tenantSchema = z.uuid();

export type TokenInfo = {
    tenantId: string;
};

export interface TokenVerifier {
    verify(this: void, token: string): Promise<TokenInfo>;
}

export class OidcTokenVerifier implements TokenVerifier {
    private readonly keySet: JWTVerifyGetKey;

    public constructor(
        private readonly settings: OidcSettings,
        keySet?: JWTVerifyGetKey,
    ) {
        this.keySet = keySet ?? createRemoteJWKSet(new URL(settings.jwksUrl));
    }

    public async verify(token: string): Promise<TokenInfo> {
        try {
            const { payload } = await jwtVerify(token, this.keySet, {
                issuer: this.settings.issuer.replace(/\/$/, ''),
                audience: this.settings.audience,
                algorithms: ['RS256'],
                requiredClaims: ['sub', 'iat', 'exp', 'tenant_id'],
            });
            const tenantId = tenantSchema.parse(payload.tenant_id);
            const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];
            if (!scopes.includes(this.settings.requiredScope)) {
                throw new TokenError('Token is not allowed');
            }
            return { tenantId };
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            throw new TokenError('Token is not allowed', { cause: error });
        }
    }
}
