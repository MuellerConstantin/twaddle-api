import logger from "../config/logger";

/**
 * Catchs asynchronous errors and redirect them using the middleware chain.
 * This is only required for Express 4.x, since Express 5.x asynchronous errors
 * are supported by default.
 *
 * @param {*} route Route to handle asyncronous errors for
 * @returns Returns the route wrapped by the error handler
 */
export const asyncHandler = (route) => async (req, res, next) => {
  try {
    return await route(req, res, next);
  } catch (error) {
    return next(error);
  }
};

/**
 * Standardized API error Format for implementing uniform error messages.
 * This class should be used instead of the base class {@link Error}.
 */
export class ApiError extends Error {
  /**
   * Constructs an API error.
   *
   * @param {string=} message Human-readable error message
   * @param {number=} status Used HTTP status code
   * @param {string=} code Internal error code, usually the error name
   * @param {any=} details Optional details depending on the error
   * @param {Map<string, any>=} headers Optional headers sent as HTTP headers and not as response body
   */
  constructor(message, status, code, details, headers) {
    super(message || "Internal server error occurred");
    this.status = status || 500;
    this.code = code || "InternalServerError";
    this.details = details;
    this.headers = headers;
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Default handler that's used for missing routes.
 *
 * @returns Returns the default handler.
 */
export const notFoundHandler = () => (req, res, next) => {
  next(new ApiError("Resource not found", 404, "NotFoundError"));
};

/**
 * Middleware handles API errors and transforms them to meaningful
 * HTTP responses.
 *
 * @returns Returns the error handling middleware.
 */
export const errorHandler = () => (error, req, res, next) => {
  let apiError;

  if (error instanceof ApiError) {
    apiError = error;
    if (apiError.headers) {
      apiError.headers.forEach((value, key) => res.setHeader(key, value));
    }
  } else {
    apiError = new ApiError();
  }

  if (apiError.status >= 500) {
    logger.error("Internal error occurred -", error);
  }

  res.status(apiError.status).json(apiError);
  next();
};
