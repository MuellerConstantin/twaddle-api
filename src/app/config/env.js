import joi from 'joi';

const envSchema = joi
  .object()
  .keys({
    LOGGER_LEVEL: joi
      .string()
      .valid('emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug')
      .default('notice'),
    LOGGER_FILENAME: joi.string().optional(),
    MONGO_URL: joi.string().required().uri(),
    REDIS_URL: joi.string().required().uri(),
    AUTH_TOKEN_SECRET: joi.string().required(),
    AUTH_TOKEN_EXPIRES: joi.number().min(1).default(300),
    REFRESH_TOKEN_EXPIRES: joi.number().min(1).default(18000),
    VERIFICATION_TOKEN_EXPIRES: joi.number().min(1).default(600),
    RESET_TOKEN_EXPIRES: joi.number().min(1).default(600),
    MAIL_HOST: joi.string().required(),
    MAIL_PORT: joi.number().required(),
    MAIL_USER: joi.string().optional(),
    MAIL_PASS: joi.string().optional(),
    MAIL_SECURE: joi.boolean().default(false),
  })
  .unknown();

const {value: env, error} = envSchema.prefs({errors: {label: 'key'}}).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  logger: {
    level: env.LOGGER_LEVEL,
    filename: env.LOGGER_FILENAME,
  },
  mongo: {
    uri: env.MONGO_URL,
  },
  redis: {
    uri: env.REDIS_URL,
  },
  authToken: {
    secret: env.AUTH_TOKEN_SECRET,
    issuer: 'Twaddle API',
    expires: env.AUTH_TOKEN_EXPIRES,
  },
  refreshToken: {
    expires: env.REFRESH_TOKEN_EXPIRES,
  },
  verificationToken: {
    expires: env.VERIFICATION_TOKEN_EXPIRES,
  },
  resetToken: {
    expires: env.RESET_TOKEN_EXPIRES,
  },
  mail: {
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
    secure: env.MAIL_SECURE,
  },
};
