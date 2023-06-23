import {randomBytes} from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import redis from '../config/redis';

/**
 * Generates a new access token.
 *
 * @param {string} subject Subject to generate token for
 * @param {object=} payload Optional payload to include in token
 * @return {string} Returns the generated token
 */
export async function generateAccessToken(subject, payload = {}) {
  return jwt.sign(payload, env.authToken.secret, {
    issuer: env.authToken.issuer,
    subject,
    expiresIn: env.authToken.expires,
  });
}

/**
 * Generates a new refresh token.
 *
 * @param {string} subject Subject to generate token for
 * @return {string} Returns the generated token
 */
export async function generateRefreshToken(subject) {
  const refreshToken = randomBytes(12).toString('hex');

  await redis.set(`refreshToken:${refreshToken}`, subject, {
    EX: env.refreshToken.expires,
  });

  return refreshToken;
}
