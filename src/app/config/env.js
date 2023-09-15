import joi from 'joi';

const envSchema = joi
  .object()
  .keys({
    FIRST_PARTY_CLIENT_BASE_URL: joi.string().uri().required(),
    LOGGER_LEVEL: joi
      .string()
      .valid('emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug')
      .default('notice'),
    LOGGER_FILENAME: joi.string().optional(),
    MONGO_URI: joi.string().required().uri(),
    REDIS_URI: joi.string().required().uri(),
    AUTH_TOKEN_SECRET: joi.string().required(),
    AUTH_TOKEN_EXPIRES: joi.number().min(1).default(300),
    REFRESH_TOKEN_EXPIRES: joi.number().min(1).default(18000),
    VERIFICATION_TOKEN_EXPIRES: joi.number().min(1).default(600),
    RESET_TOKEN_EXPIRES: joi.number().min(1).default(600),
    TICKET_EXPIRES: joi.number().min(1).default(120),
    SMTP_HOST: joi.string().required(),
    SMTP_PORT: joi.number().required(),
    SMTP_USER: joi.string().optional(),
    SMTP_PASSWORD: joi.string().optional(),
    SMTP_SECURE: joi.boolean().default(false),
    S3_URI: joi.string().required().uri(),
    S3_ACCESS_KEY_ID: joi.string().required(),
    S3_SECRET_ACCESS_KEY: joi.string().required(),
    S3_REGION: joi.string().required(),
    S3_BUCKET: joi.string().required(),
  })
  .unknown();

const {value: env, error} = envSchema.prefs({errors: {label: 'key'}}).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  firstPartyClient: {
    baseUrl: env.FIRST_PARTY_CLIENT_BASE_URL,
  },
  logger: {
    level: env.LOGGER_LEVEL,
    filename: env.LOGGER_FILENAME,
  },
  mongo: {
    uri: env.MONGO_URI,
  },
  redis: {
    uri: env.REDIS_URI,
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
  ticket: {
    expires: env.TICKET_EXPIRES,
  },
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASS,
    secure: env.SMTP_SECURE,
  },
  s3: {
    uri: env.S3_URI,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
  },
};
