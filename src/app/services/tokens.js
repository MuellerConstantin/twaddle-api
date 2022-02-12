import jwt from "jsonwebtoken";
import env from "../config/env";

/**
 * Generates a new access token.
 *
 * @param {string} subject Subject to generate token for
 * @param {object=} payload Optional payload to include in token
 * @returns {string} Returns the generated token
 */
// eslint-disable-next-line import/prefer-default-export
export const generateToken = (subject, payload = {}) => {
  return jwt.sign(payload, env.security.jwt.privateKey, {
    algorithm: "RS256",
    issuer: env.security.jwt.issuer,
    subject,
    expiresIn: env.security.jwt.expires,
  });
};
