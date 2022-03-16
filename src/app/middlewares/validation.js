// eslint-disable-next-line no-unused-vars
import joi from "joi";

import { ApiError, ApiErrorCode } from "./error";

/**
 * Validation middleware to validate the request queries.
 *
 * @param {joi.Schema} schema Schema that the body must match
 * @returns Returns the constructed validation middleware
 */
// eslint-disable-next-line import/prefer-default-export
export const queryValidationHandler = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false });

  if (error) {
    const errorDetails = error.details.map((detail) => {
      let message = detail.message.match(/^(?:".+" )?(.+)$/)[1];
      message = message.charAt(0).toUpperCase() + message.slice(1);

      return {
        path: detail.path.join("."),
        message,
      };
    });

    const apiError = new ApiError(
      "Validation failed",
      400,
      ApiErrorCode.INVALID_QUERY_PARAMETER_ERROR,
      errorDetails
    );

    next(apiError);
  } else {
    req.query = value;
    next();
  }
};

/**
 * Validation middleware to validate the request params.
 *
 * @param {joi.Schema} schema Schema that the body must match
 * @returns Returns the constructed validation middleware
 */
// eslint-disable-next-line import/prefer-default-export
export const paramsValidationHandler = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorDetails = error.details.map((detail) => {
      let message = detail.message.match(/^(?:".+" )?(.+)$/)[1];
      message = message.charAt(0).toUpperCase() + message.slice(1);

      return {
        path: detail.path.join("."),
        message,
      };
    });

    const apiError = new ApiError(
      "Validation failed",
      400,
      ApiErrorCode.INVALID_PATH_VARIABLE_ERROR,
      errorDetails
    );

    next(apiError);
  } else {
    req.params = value;
    next();
  }
};

/**
 * Validation middleware to validate the request body.
 *
 * @param {joi.Schema} schema Schema that the body must match
 * @returns Returns the constructed validation middleware
 * @deprecated Use service layer validation instead
 */
// eslint-disable-next-line import/prefer-default-export
export const bodyValidationHandler = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorDetails = error.details.map((detail) => {
      let message = detail.message.match(/^(?:".+" )?(.+)$/)[1];
      message = message.charAt(0).toUpperCase() + message.slice(1);

      return {
        path: detail.path.join("."),
        message,
      };
    });

    const apiError = new ApiError(
      "Validation failed",
      422,
      ApiErrorCode.VALIDATION_ERROR,
      errorDetails
    );

    next(apiError);
  } else {
    req.body = value;
    next();
  }
};

/**
 * Allows to validate a data structure on service layer.
 *
 * @param {joi.Schema} schema Schema that the data structure must match
 * @param {any} data Data structure to validate
 * @returns Returns the validated and optionally transformed data structure
 */
export const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    const errorDetails = error.details.map((detail) => {
      let message = detail.message.match(/^(?:".+" )?(.+)$/)[1];
      message = message.charAt(0).toUpperCase() + message.slice(1);

      return {
        path: detail.path.join("."),
        message,
      };
    });

    throw new ApiError(
      "Validation failed",
      422,
      ApiErrorCode.VALIDATION_ERROR,
      errorDetails
    );
  } else {
    return value;
  }
};
