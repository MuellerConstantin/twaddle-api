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
      return next(new ApiError('Invalid refresh token provided', 401));
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
      return next(new ApiError('Invalid access token provided', 401));
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
