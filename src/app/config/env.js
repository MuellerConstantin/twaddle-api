/**
 * @file Validates the loaded environment and ensures that all required environment variables are set.
 */

import joi from "joi";
import fs from "fs";
import path from "path";

const envSchema = joi
  .object()
  .keys({
    LOGGER_LEVEL: joi
      .string()
      .valid(
        "emerg",
        "alert",
        "crit",
        "error",
        "warning",
        "notice",
        "info",
        "debug"
      )
      .default("notice"),
    LOGGER_FILENAME: joi.string().optional(),
    DATABASE_URI: joi.string().required().uri(),
    CACHE_URI: joi.string().required().uri(),
    SECURITY_JWT_PUBLIC_KEY_PATH: joi.string().required(),
    SECURITY_JWT_PRIVATE_KEY_PATH: joi.string().required(),
    SECURITY_JWT_ISSUER: joi.string().required(),
    SECURITY_JWT_EXPIRES: joi.number().min(1).default(2700),
    SECURITY_TICKET_EXPIRES: joi.number().min(1).default(120),
    SECURITY_RATE_LIMIT: joi.number().integer().positive().default(60),
    UPLOADS_PATH: joi.string().required(),
    UPLOADS_LIMITS_FILESIZE: joi
      .number()
      .integer()
      .positive()
      .default(1024 * 1024 * 5 /* 5MB */),
  })
  .unknown();

const { value: env, error } = envSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  logger: {
    level: env.LOGGER_LEVEL,
    filename: env.LOGGER_FILENAME,
  },
  database: {
    uri: env.DATABASE_URI,
  },
  uploads: {
    path: env.UPLOADS_PATH,
    limits: {
      fileSize: env.UPLOADS_LIMITS_FILESIZE,
    },
  },
  cache: {
    uri: env.CACHE_URI,
  },
  security: {
    jwt: {
      publicKey: fs.readFileSync(
        path.resolve(env.SECURITY_JWT_PUBLIC_KEY_PATH)
      ),
      privateKey: fs.readFileSync(
        path.resolve(env.SECURITY_JWT_PRIVATE_KEY_PATH)
      ),
      issuer: env.SECURITY_JWT_ISSUER,
      expires: env.SECURITY_JWT_EXPIRES,
    },
    ticket: {
      expires: env.SECURITY_TICKET_EXPIRES,
    },
    rateLimit: env.SECURITY_RATE_LIMIT,
  },
};
