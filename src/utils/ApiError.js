class ApiError extends Error {
    constructor(statusCode, message , errors = []) {
        super();
        this.statusCode = statusCode
        this.success = false
        this.message = message
    }
}

export {ApiError}