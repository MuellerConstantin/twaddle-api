/**
 * @file Entry point of the application which initializes the system and database.
 */

// eslint-disable-next-line no-unused-vars
import http from "http";

import path from "path";
import express from "express";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import helmet from "helmet";
import env from "./config/env";
import logger from "./config/logger";
import mongoose from "./config/mongoose";
import redis from "./config/redis";
import morgan from "./config/morgan";
import passport from "./config/passport";
import rateLimiter from "./config/rateLimiter";
import * as error from "./middlewares/error";
import { authenticateTicket } from "./middlewares/authentication";
import v1Routes from "./routes/v1";
import v1Handlers from "./handlers/v1";

/**
 * Lifecycle callback that should be called before the application server ist starting.
 * Ideal for establishing database connections and other resources that should be
 * available at runtime.
 *
 * @param {http.Server} server HTTP server instance used for serving the application
 */
export const beforeStarting = async (server) => {
  logger.notice("Application is starting");
  await redis.connect();
  await mongoose.openUri(env.database.uri);

  const ioSubRedis = redis.duplicate();
  const ioPubRedis = redis.duplicate();

  await ioSubRedis.connect();
  await ioPubRedis.connect();

  const io = new SocketServer(server, { cors: true });
  io.adapter(createAdapter(ioSubRedis, ioPubRedis));

  const v1Nsp = io.of("/ws/v1");
  v1Nsp.use(authenticateTicket());
  v1Nsp.on("connection", v1Handlers);
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
app.use(express.static(path.resolve(__dirname, "../../public")));
app.use(cors());
app.use(helmet());
app.use(morgan());
app.use(passport.initialize());

app.use("/api", rateLimiter(), v1Routes);

app.use(error.notFoundHandler());
app.use(error.errorHandler());

export default app;
