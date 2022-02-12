/**
 * @file Entry point of the application which initializes the system and database.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./config/env";
import logger from "./config/logger";
import mongoose from "./config/mongoose";
import redis from "./config/redis";
import morgan from "./config/morgan";
import passport from "./config/passport";
import * as error from "./middlewares/error";
import v1Routes from "./routes/v1";

/**
 * Lifecycle callback that should be called before the application server ist starting.
 * Ideal for establishing database connections and other resources that should be
 * available at runtime.
 */
export const beforeStarting = async () => {
  logger.notice("Application is starting");
  await redis.connect();
  await mongoose.openUri(env.database.uri);
};

/**
 * Lifecycle callback that should be called immediately after the application server started.
 * Intended for logging status messages and extended runtime information.
 *
 * @param {string|number} bind Port binding in the form of an address pipe or a port
 */
export const afterStarting = async (bind) => {
  logger.notice(`Application started and is listening on '${bind}'`);
  logger.notice(`Environment of profile '${process.env.NODE_ENV}' was loaded`);
  logger.notice(`Logger level was set to '${env.logger.level}'`);
};

/**
 * Lifecylce callback that should be called before application server is stopping.
 * Used to free resources and disconnect clients.
 */
export const beforeStopping = async () => {
  logger.notice("Application is stopping");
};

/**
 * Lifecycle callback that should be called immediately after the application server stopped.
 * Intended for logging status messages and extended runtime information.
 */
export const afterStopping = async () => {
  logger.notice("Application stopped");
  await mongoose.close();
  await redis.disconnect();
};

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan());
app.use(passport.initialize());

app.use("/api", v1Routes);

app.use(error.notFoundHandler());
app.use(error.errorHandler());

export default app;
