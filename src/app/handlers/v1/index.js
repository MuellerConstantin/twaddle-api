// eslint-disable-next-line no-unused-vars
import {Socket} from 'socket.io';

import logger from '../../config/logger';
import {SocketError, ApiError} from '../../middlewares/error';
import * as ChatService from '../../services/chats';

/**
 * Root handler for handling incoming socket connections.
 *
 * @param {Socket} socket Incoming socket connection
 */
const handler = async (socket) => {
  logger.debug(`WS ${socket.nsp.name} - ${socket.user.username} established connection`);

  socket.join(socket.user.id);

  socket.on('message', async ({content, to}) => {
    try {
      const chat = await ChatService.addMessageToChat(to, {
        content,
        from: socket.user.id,
      });

      const message = {
        content,
        from: socket.user.id,
        to,
        timestamp: new Date(),
      };

      socket.emit('message', message);
      chat.participants.forEach((participant) => {
        if (participant.id !== socket.user.id) {
          socket.to(participant.id).emit('message', message);
        }
      });
    } catch (err) {
      if (err instanceof ApiError) {
        socket.emit('error', SocketError.fromApiError(err));
      } else {
        socket.emit('error', new SocketError('Internal server error occurred', 500));
      }
    }
  });
};

export default handler;
