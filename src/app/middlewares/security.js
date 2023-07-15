import passport from 'passport';
import {ApiError} from './error';

/**
 * Authenticates by using the token strategy. In detail, it expects to find
 * a bearer token in the Authorization header.
 *
 * @return {*} Returns the constructed authentication middleware
 */
export const authenticateAccessToken = () => (req, res, next) => {
  passport.authenticate('accessToken', {session: false}, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new ApiError('Invalid access token provided', 401));
    }

    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Authenticates by using the token strategy. In detail, it expects to find
 * a bearer token in the Authorization header.
 *
 * @return {*} Returns the constructed authentication middleware
 */
export const authenticateRefreshToken = () => (req, res, next) => {
  passport.authenticate('refreshToken', {session: false}, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new ApiError('Invalid refresh token provided', 401));
    }

    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Authenticates using credentials. Therefore, it expects to found username and
 * password in the request body.
 *
 * @return {*} Returns the constructed authentication middleware
 */
export const authenticateCredentials = () => (req, res, next) => {
  passport.authenticate('credentials', {session: false}, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new ApiError('Invalid credentials provided', 401));
    }

    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Authorization middleware that expects a predicate. If predicate resolves to true, the access
 * is granted, otherwise the request is rejected.
 *
 * @param {Function} predicate Predicate that contains the authorization condition
 * @return {*} Returns the constructed authorization middleware
 */
export const authorize = (predicate) => async (req, res, next) => {
  const accessGranted = await predicate(req);

  if (accessGranted) {
    next();
  } else {
    next(
      new ApiError("Access denied because of missing permissions", 403)
    );
  }
};
