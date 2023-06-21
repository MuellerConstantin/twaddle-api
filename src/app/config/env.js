import joi from 'joi';

const envSchema = joi
  .object()
  .keys({
    LOGGER_LEVEL: joi
      .string()
      .valid('emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug')
      .default('notice'),
    LOGGER_FILENAME: joi.string().optional(),
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
};
