export class ApiError extends Error {
	public readonly statusCode: number;
	public readonly code: string;

	constructor(statusCode: number, message: string, code: string) {
		super(message);
		this.statusCode = statusCode;
		this.code = code;
	}

	static badRequest(message: string): ApiError {
		return new ApiError(400, message, "INVALID_PARAMS");
	}

	static notFound(message: string): ApiError {
		return new ApiError(404, message, "NOT_FOUND");
	}

	static conflict(message: string): ApiError {
		return new ApiError(409, message, "CONFLICT");
	}

	static internal(message: string): ApiError {
		return new ApiError(500, message, "INTERNAL_ERROR");
	}
}
