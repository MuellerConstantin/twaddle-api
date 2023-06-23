import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env';
import logger from './config/logger';
import mongoose from './config/mongoose';
import redis from './config/redis';
import morgan from './middlewares/morgan';
import passport from './middlewares/passport';
import * as error from './middlewares/error';
import v1Routes from './routes/v1';

/**
 * Wrapper class for the Express application.
 */
class ExpressApplication {
  /**
   * Constructs the Express application.
   */
  constructor() {
    this._app = express();

    this._app.use(express.json());
    this._app.use(express.urlencoded({extended: true}));
    this._app.use(cors());
    this._app.use(helmet());
    this._app.use(morgan());
    this._app.use(passport.initialize());

    this._app.use('/api', v1Routes);

    this._app.use(error.notFoundHandler());
    this._app.use(error.errorHandler());
  }

  /**
   * Lifecycle callback that should be called before the application server ist starting.
   * Ideal for establishing database connections and other resources that should be
   * available at runtime.
   */
  async beforeStarting() {
    logger.notice('Application is starting');

    await mongoose.connect();
    await redis.connect();
  }

  /**
   * Lifecycle callback that should be called immediately after the application server started.
   * Intended for logging status messages and extended runtime information.
   *
   * @param {string|number} bind Port binding in the form of an address pipe or a port
   */
  async afterStarting(bind) {
    logger.notice(`Application started and is listening on '${bind}'`);
    logger.notice(`Environment of profile '${process.env.NODE_ENV}' was loaded`);
    logger.notice(`Logger level was set to '${env.logger.level}'`);
  }

  /**
   * Lifecylce callback that should be called before application server is stopping.
   * Used to free resources and disconnect clients.
   */
  async beforeStopping() {
    logger.notice('Application is stopping');
  }

  /**
   * Lifecycle callback that should be called immediately after the application server stopped.
   * Intended for logging status messages and extended runtime information.
   */
  async afterStopping() {
    logger.notice('Application stopped');
  }

  /**
   * Returns the underlying Express instance.
   */
  get express() {
    return this._app;
  }
}

export default new ExpressApplication();
