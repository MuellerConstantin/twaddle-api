// eslint-disable-next-line max-classes-per-file
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
 * All error codes used by the RESTful interface.
 */
export const ApiErrorCode = {
  INTERNAL_SERVER_ERROR: "InternalServerError",
  NOT_FOUND_ERROR: "NotFoundError",
  INVALID_QUERY_PARAMETER_ERROR: "InvalidQueryParameterError",
  INVALID_PATH_VARIABLE_ERROR: "InvalidPathVariableError",
  VALIDATION_ERROR: "ValidationError",
  INVALID_CREDENTIALS_ERROR: "InvalidCredentialsError",
  INVALID_TOKEN_ERROR: "InvalidTokenError",
  ACCESS_DENIED_ERROR: "AccessDeniedError",
  ROOM_NAME_ALREADY_IN_USE_ERROR: "RoomNameAlreadyInUseError",
  USERNAME_ALREAY_IN_USE_ERROR: "UsernameAlreadyInUseError",
  EMAIL_ALREADY_IN_USE_ERROR: "EmailAlreadyInUseError",
  MUST_BE_ADMINISTRABLE_ERROR: "MustBeAdministrableError",
  ACCOUNT_BLOCKED_ERROR: "AccountBlockedError",
  TOO_MANY_REQUESTS_ERROR: "TooManyRequestsError",
  REST_QUERY_LANGUAGE_ERROR: "RestQueryLanguageError",
};

Object.freeze(ApiErrorCode);

/**
 * Standardized API error Format for implementing uniform error messages.
 * This class should be used instead of the base class {@link Error}.
 *
 * @class
 * @extends Error
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
    this.code = code || ApiErrorCode.INTERNAL_SERVER_ERROR;
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
 * All error codes used by the WebSocket interface.
 */
export const SocketErrorCode = {
  INTERNAL_SERVER_ERROR: "InternalServerError",
  NOT_FOUND_ERROR: "NotFoundError",
  INVALID_TICKET_ERROR: "InvalidTicketError",
  ALREADY_CONNECTED_ERROR: "AlreadyConnectedError",
  NO_ROOM_ASSOCIATED_ERROR: "NoRoomAssociatedError",
  ACCOUNT_BLOCKED_ERROR: "AccountBlockedError",
};

Object.freeze(SocketErrorCode);

/**
 * Standardized socket error Format for implementing uniform error messages.
 * This class should be used instead of the base class {@link Error}.
 *
 * @class
 * @extends Error
 */
export class SocketError extends Error {
  /**
   * Constructs an API error.
   *
   * @param {string=} message Human-readable error message
   * @param {string=} code Internal error code, usually the error name
   * @param {any=} details Optional details depending on the error
   */
  constructor(message, code, details) {
    super(message || "Internal server error occurred");
    this.code = code || SocketErrorCode.INTERNAL_SERVER_ERROR;
    this.details = details;
  }

  toJSON() {
    return {
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
  next(new ApiError("Resource not found", 404, ApiErrorCode.NOT_FOUND_ERROR));
};

/**
 * Middleware handles API errors and transforms them to meaningful
 * HTTP responses.
 *
 * @returns {expres} Returns the error handling middleware.
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
