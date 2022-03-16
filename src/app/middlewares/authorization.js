import { ApiError, ApiErrorCode } from "./error";

/**
 * Authorization middleware that expects a predicate. If predicate resolves to true, the access
 * is granted, otherwise the request is rejected.
 *
 * @param {(req) => Promise<boolean>} predicate Predicate that contains the authorization condition.
 * @returns Returns the constructed authorization middleware.
 */
// eslint-disable-next-line import/prefer-default-export
export const authorize = (predicate) => async (req, res, next) => {
  const accessGranted = await predicate(req);

  if (accessGranted) {
    next();
  } else {
    next(
      new ApiError(
        "Access denied because of missing permissions",
        403,
        ApiErrorCode.ACCESS_DENIED_ERROR
      )
    );
  }
};
