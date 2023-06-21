import {createClient} from 'redis';
import env from './env';
import logger from './logger';

const client = createClient(env.redis.uri);

client.on('error', (err) => logger.error('Redis database connection error occurred', err));

client.on('ready', () => logger.notice(`Redis database connection established to '${env.redis.uri}'`));

client.on('end', () => logger.notice('Redis database connection closed'));

export default client;
