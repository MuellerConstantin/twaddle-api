import logger from '../config/logger';

/**
 * Catchs asynchronous errors and redirect them using the middleware chain.
 * This is only required for Express 4.x, since Express 5.x asynchronous errors
 * are supported by default.
 *
 * @param {*} route Route to handle asyncronous errors for
 * @return {*} Returns the route wrapped by the error handler
 */
export const asyncHandler = (route) => async (req, res, next) => {
  try {
    return await route(req, res, next);
  } catch (error) {
    return next(error);
  }
};

/**
 * Standardized API error format for implementing uniform error messages.
 * This class should be used instead of the base class {@link Error}.
 */
export class ApiError extends Error {
  /**
   * Constructs an API error.
   *
   * @param {string=} message Human-readable error message
   * @param {number=} status Used HTTP status code
   * @param {any=} details Optional details depending on the error
   * @param {Map<string, any>=} headers Optional headers sent as HTTP headers and not as response body
   */
  constructor(message, status, details, headers) {
    super(message || 'Internal server error occurred');
    this.status = status || 500;
    this.details = details;
    this.headers = headers;
  }

  /**
   * Serializes the error to JSON.
   *
   * @return {object} Returns the error as JSON object
   */
  toJSON() {
    return {
      status: this.status,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Standardized socket error format for implementing uniform error messages.
 * This class should be used instead of the base class {@link Error} for
 * socket errors.
 */
export class SocketError extends Error {
  /**
   * Constructs an Socket error.
   *
   * @param {string=} message Human-readable error message
   * @param {string=} status Internal error code, usually a euqivalent HTTP status code is used
   * @param {any=} details Optional details depending on the error
   */
  constructor(message, status, details) {
    super(message || 'Internal server error occurred');
    this.status = status || 500;
    this.details = details;
  }

  /**
   * Serializes the error to JSON.
   *
   * @return {object} Returns the error as JSON object
   */
  toJSON() {
    return {
      message: this.message,
      status: this.status,
      details: this.details,
    };
  }

  /**
   * Converts an API error to a socket error.
   *
   * @param {ApiError} apiError The API error to convert
   * @return {SocketError} Returns the converted socket error
   */
  static fromApiError(apiError) {
    return new SocketError(apiError.message, apiError.status, apiError.details);
  }
}

/**
 * Default handler that's used for missing routes
 *
 * @return {*} Returns the default handler middleware
 */
export const notFoundHandler = () => (req, res, next) => {
  return next(new ApiError('Resource not found', 404, 'NotFoundError'));
};

/**
 * Middleware handles API errors and transforms them to meaningful
 * HTTP responses.
 *
 * @return {*} Returns the error handling middleware.
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
    logger.error('Internal error occurred -', error);
  }

  res.status(apiError.status).json(apiError);
  return next();
};
