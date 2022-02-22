// eslint-disable-next-line no-unused-vars
import { Socket } from "socket.io";

import logger from "../../config/logger";
import { SocketError } from "../../middlewares/error";
import * as UserService from "../../services/users";
import roomHandler from "./rooms";

/**
 * Root handler for handling incoming socket connections.
 *
 * @param {Socket} socket Incoming socket connection
 */
const handler = async (socket) => {
  // Mark user as online
  const canConnect = await UserService.lockOnline(socket.user.username);

  // Ensure user can establish only one connection at the same time
  if (!canConnect) {
    socket.emit(
      "twaddle/error",
      new SocketError(
        "A connection already exists, only one connection per user allowed",
        "AlreadyConnectedError"
      )
    );

    logger.debug(
      `WS ${socket.nsp.name} - ${socket.user.username} tried to establish second connection`
    );
    socket.disconnect(true);
    return;
  }

  logger.debug(
    `WS ${socket.nsp.name} - ${socket.user.username} established connection`
  );

  socket.conn.on("packet", async (packet) => {
    if (packet.type === "pong") {
      await UserService.refreshOnlineLock(socket.user.username);
    }
  });

  roomHandler(socket);

  socket.on("disconnect", async () => {
    await UserService.unlockOnline(socket.user.username);
    logger.debug(
      `WS ${socket.nsp.name} - ${socket.user.username} closed connection`
    );
  });
};

export default handler;
