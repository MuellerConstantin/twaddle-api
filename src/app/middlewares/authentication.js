import passport from "passport";
import { ApiError, SocketError, ApiErrorCode, SocketErrorCode } from "./error";
import logger from "../config/logger";

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
        new ApiError(
          "Invalid token provided",
          401,
          ApiErrorCode.INVALID_TOKEN_ERROR
        )
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
          ApiErrorCode.INVALID_CREDENTIALS_ERROR
        )
      );
    }

    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Authenticate a websocket connection using tickets. Therefore, it expects
 * a query parameter containing the ticket.
 *
 * Please note: This middleware is specially designed to work with a Websocket
 * endpoint and <b>NOT</b> with a RESTful endpoint.
 *
 * @returns Returns the constructed middleware.
 */
export const authenticateTicket = () => async (socket, next) => {
  passport.authenticate("ticket", { session: false }, (err, user) => {
    if (err) {
      const internalErr = new Error("Internal server error occurred");
      internalErr.data = new SocketError().toJSON();

      logger.error("Internal error occurred -", err);
      return next(internalErr);
    }

    if (!user) {
      const authErr = new Error("Invalid ticket provided");
      authErr.data = new SocketError(
        "Invalid ticket provided",
        SocketErrorCode.INVALID_TICKET_ERROR
      ).toJSON();

      return next(authErr);
    }

    if (user.blocked) {
      const authErr = new Error(
        "The account was blocked for policy violations"
      );
      authErr.data = new SocketError(
        "The account was blocked for policy violations",
        SocketErrorCode.ACCOUNT_BLOCKED_ERROR
      ).toJSON();

      return next(authErr);
    }

    // eslint-disable-next-line no-param-reassign
    socket.user = user;
    return next();
  })(socket.request, {}, next);
};
