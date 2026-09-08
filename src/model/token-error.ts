export class TokenError extends Error {
    public constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'TokenError';
    }
}
