/**
 * Base class for a API that needs a token.
 */
export abstract class BaseAPI {
    protected token: string;

    constructor(token: string) {
        this.token = token;
    }
}
