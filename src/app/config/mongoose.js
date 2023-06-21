import mongoose from 'mongoose';
import logger from './logger';
import env from './env';

const connection = mongoose.createConnection();

connection.on('error', (err) => logger.error('Database connection error occurred', err));

connection.on('connected', () => {
  logger.notice(
    `MongoDB database connection established to 'mongodb://${connection.host}:${connection.port}/${
      connection.name || ''
    }'`,
  );
});

connection.on('disconnected', () => logger.notice('Database connection closed'));

/**
 * Connects to the MongoDB database.
 */
connection.connect = async () => {
  await connection.openUri(env.mongo.uri);
};

export default connection;
