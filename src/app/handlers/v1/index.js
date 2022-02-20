// eslint-disable-next-line no-unused-vars
import { Socket } from "socket.io";

import logger from "../../config/logger";

/**
 *
 * @param {Socket} socket
 */
const handler = (socket) => {
  logger.debug(`WS ${socket.nsp.name} Connection established`);

  socket.on("disconnect", () => {
    logger.debug(`WS ${socket.nsp.name} Connection closed`);
  });
};

export default handler;
