// eslint-disable-next-line no-unused-vars
import { Socket } from "socket.io";

import logger from "../../config/logger";

/**
 * Root handler for handling incoming socket connections.
 *
 * @param {Socket} socket Incoming socket connection
 */
const handler = async (socket) => {
  logger.debug(
    `WS ${socket.nsp.name} - ${socket.user.username} established connection`
  );

  socket.join(socket.user.id);

  socket.on("message", ({ content, to }) => {
    const message = {
      content,
      from: socket.user.id,
      to,
    };

    socket.to(to).emit("message", message);
    socket.emit("message", message);
  });
};

export default handler;
