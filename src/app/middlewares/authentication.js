import passport from "passport";
import { ApiError } from "./error";

/**
 * Authenticates by using the token strategy. In detail, it expects to find
 * a bearer token in the Authorization header.
 *
 * @returns Returns the constructed authentication middleware.
 */
export const authenticateToken = () => (req, res, next) => {
  passport.authenticate("token", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(
        new ApiError("Invalid token provided", 401, "InvalidTokenError")
      );
    }

    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Authenticates using credentials. Therefore, it expects to found username and
 * password in the request body.
 *
 * @returns Returns the constructed authentication middleware.
 */
export const authenticateCredentials = () => (req, res, next) => {
  passport.authenticate("credentials", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(
        new ApiError(
          "Invalid credentials provided",
          401,
          "InvalidCredentialsError"
        )
      );
    }

    req.user = user;
    return next();
  })(req, res, next);
};
