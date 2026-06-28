/** Error type used by the SDK for explicit exception-mode helpers. Never thrown
 *  internally for HTTP failures (those are encoded in the envelope). */
export class SpmClientException extends Error {
  response: unknown;

  statusCode: number;

  constructor(message: string, response: unknown = null, statusCode = 0) {
    super(message);
    this.name = 'SpmClientException';
    this.response = response;
    this.statusCode = statusCode;
  }

  hasResponse(): boolean {
    return this.response !== null && this.response !== undefined;
  }

  getResponse(): unknown {
    return this.response;
  }

  getStatusCode(): number {
    return this.statusCode;
  }
}
