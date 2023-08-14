import express from 'express';
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env';
import logger from './config/logger';
import mongoose from './config/mongoose';
import redis from './config/redis';
import morgan from './middlewares/morgan';
import passport from './middlewares/passport';
import * as error from './middlewares/error';
import { authenticateTicket } from "./middlewares/security";
import v1Routes from './routes/v1';
import v1Handler from './handlers/v1';

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

    this._app.set('view engine', 'ejs');
    this._app.set('views', 'resources/views');
    this._app.use('/public', express.static('resources/public'));

    this._app.use(error.notFoundHandler());
    this._app.use(error.errorHandler());
  }

  /**
   * Lifecycle callback that should be called before the application server ist starting.
   * Ideal for establishing database connections and other resources that should be
   * available at runtime.
   * 
   * @param {http.Server} server HTTP server instance used for serving the application
   */
  async beforeStarting(server) {
    logger.notice('Application is starting');

    await mongoose.connect();
    await redis.connect();

    const ioSubRedis = redis.duplicate();
    const ioPubRedis = redis.duplicate();

    await ioSubRedis.connect();
    await ioPubRedis.connect();

    const io = new SocketServer(server, { cors: true });
    io.adapter(createAdapter(ioSubRedis, ioPubRedis));

    const ioV1 = io.of("/ws/v1");
    ioV1.use(authenticateTicket());
    ioV1.on("connection", v1Handler);
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
