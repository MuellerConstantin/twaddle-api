#!/usr/bin/env node

/**
 * @file Application start up script which loads the environment, sets up an HTTP server and starts the application.
 */

import "./env";
import http from "http";
import app, {
  beforeStarting,
  afterStarting,
  beforeStopping,
  afterStopping,
} from "./app";

const server = http.createServer(app);

const normalizePort = (value) => {
  const port = parseInt(value, 10);

  if (Number.isNaN(port)) {
    return value;
  }

  if (port >= 0) {
    return port;
  }

  return false;
};

const onError = (err) => {
  if (err.syscall !== "listen") {
    throw err;
  }

  switch (err.code) {
    case "EACCES":
      // eslint-disable-next-line no-console
      console.error("Binding requires elevated privileges", err);
      process.exit(1);
      break;
    case "EADDRINUSE":
      // eslint-disable-next-line no-console
      console.error("Binding is already in use", err);
      process.exit(1);
      break;
    default:
      throw err;
  }
};

const onListening = async () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  await afterStarting(bind);
};

const onStopping = async () => {
  await beforeStopping();
  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  await afterStopping();
};

server.on("error", onError);
server.on("listening", onListening);
process.on("SIGTERM", onStopping);

const port = normalizePort(process.env.PORT || 3000);

app.set("port", port);
beforeStarting().then(() => server.listen(port));
