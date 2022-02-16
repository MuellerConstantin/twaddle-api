import { randomBytes } from "crypto";
import env from "../config/env";
import redis from "../config/redis";

/**
 * Generates a new ticket.
 *
 * @param {string} subject Subject to generate token for
 * @returns {Promise<string>} Returns the generated ticket
 */
// eslint-disable-next-line import/prefer-default-export
export const generateTicket = async (subject) => {
  const ticket = randomBytes(12).toString("hex");

  await redis.set(`ticket:${ticket}`, subject, {
    EX: env.security.ticket.expires,
  });

  return ticket;
};
