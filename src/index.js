#!/usr/bin/env node

import './env';
import http from 'http';
import app from './app';

const server = http.createServer(app.express);

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
  if (err.syscall !== 'listen') {
    throw err;
  }

  switch (err.code) {
    case 'EACCES':
      // eslint-disable-next-line no-console
      console.error('Binding requires elevated privileges', err);
      process.exit(1);
    case 'EADDRINUSE':
      // eslint-disable-next-line no-console
      console.error('Binding is already in use', err);
      process.exit(1);
    default:
      throw err;
  }
};

const onListening = async () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  await app.afterStarting(bind);
};

const onStopping = async () => {
  await app.beforeStopping();
  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  await app.afterStopping();
};

server.on('error', onError);
server.on('listening', onListening);
process.on('SIGTERM', onStopping);

const port = normalizePort(process.env.PORT || 3000);

app.express.set('port', port);
app.beforeStarting().then(() => server.listen(port));
