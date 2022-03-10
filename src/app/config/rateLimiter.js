import { RateLimiterRedis } from "rate-limiter-flexible";
import env from "./env";
import redis from "./redis";
import { ApiError } from "../middlewares/error";

/*
 * Since the rate limiter only supports node-redis version 3,
 * an additional instance must be created in legacy mode. This
 * also means an additional connection to the Redis database.
 */
const rateLimiterRedis = redis.duplicate({ legacyMode: true });
rateLimiterRedis.connect();

const rateLimiter = new RateLimiterRedis({
  storeClient: rateLimiterRedis,
  points: env.security.rateLimit,
  duration: 60,
});

const middleware = () => (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch((rateLimiterRes) => {
      const headers = new Map([
        ["Retry-After", Math.round(rateLimiterRes.msBeforeNext / 1000)],
        ["X-RateLimit-Limit", env.security.rateLimit],
        ["X-RateLimit-Remaining", rateLimiterRes.remainingPoints],
        [
          "X-RateLimit-Reset",
          new Date(Date.now() + rateLimiterRes.msBeforeNext).toUTCString(),
        ],
      ]);

      next(
        new ApiError(
          "Too Many Requests",
          429,
          "TooManyRequestsError",
          undefined,
          headers
        )
      );
    });
};

export default middleware;
