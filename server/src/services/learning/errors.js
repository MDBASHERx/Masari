// Error thrown by learning rules. `code` maps to the API error format;
// `status` is the HTTP status the route should return.
export class LearningError extends Error {
    constructor(code, message, status = 400) {
        super(message);
        this.name = "LearningError";
        this.code = code;
        this.status = status;
    }
}
