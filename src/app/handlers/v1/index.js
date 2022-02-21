// eslint-disable-next-line no-unused-vars
import { Socket } from "socket.io";

import logger from "../../config/logger";
import redis from "../../config/redis";
import { SocketError } from "../../middlewares/error";

/**
 * Root handler for handling incoming socket connections.
 *
 * @param {Socket} socket Incoming socket connection
 */
const handler = async (socket) => {
  logger.debug(`WS ${socket.nsp.name} Connection established`);

  // Mark user as online
  const canConnect = await redis.set(
    `user:${socket.user.username}`,
    socket.id,
    {
      NX: true,
      EX: 30,
    }
  );

  // Ensure user can establish only one connection at the same time
  if (!canConnect) {
    socket.emit(
      "error",
      new SocketError(
        "A connection already exists, only one connection per user allowed",
        "AlreadyConnectedError"
      )
    );
    socket.disconnect(true);
    return;
  }

  socket.conn.on("packet", async (packet) => {
    if (packet.type === "pong") {
      await redis.set(`user:${socket.user.username}`, socket.id, {
        EX: 30,
      });
    }
  });

  socket.on("disconnect", () => {
    logger.debug(`WS ${socket.nsp.name} Connection closed`);
  });
};

export default handler;
