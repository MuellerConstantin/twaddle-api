// eslint-disable-next-line no-unused-vars
import {Socket} from 'socket.io';

import logger from '../../config/logger';
import {SocketError, ApiError} from '../../middlewares/error';
import * as UserService from '../../services/users';
import * as MessageService from '../../services/messages';
import * as ChatService from '../../services/chats';

/**
 * Root handler for handling incoming socket connections.
 *
 * @param {Socket} socket Incoming socket connection
 */
const handler = async (socket) => {
  logger.debug(`WS ${socket.nsp.name} - ${socket.user.username} established connection`);

  socket.join(socket.user.id);
  await UserService.markOnline(socket.user.id);

  const privateChats = await ChatService.getPrivateChatsOfUser(socket.user.id);

  privateChats.forEach((chat) => {
    chat.participants.forEach((participant) => {
      if (participant.id !== socket.user.id) {
        socket.to(participant.id).emit('user/online', socket.user.id);
      }
    });
  });

  socket.on('message/private', async ({content, to}) => {
    try {
      const chat = await MessageService.addMessageToPrivateChat(to, {
        content,
        from: socket.user.id,
      });

      const message = {
        content,
        from: socket.user.id,
        to,
        timestamp: new Date(),
      };

      socket.emit('message/private', message);
      chat.participants.forEach((participant) => {
        if (participant.id !== socket.user.id) {
          socket.to(participant.id).emit('message/private', message);
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

  socket.on('message/group', async ({content, to}) => {
    try {
      const chat = await MessageService.addMessageToGroupChat(to, {
        content,
        from: socket.user.id,
      });

      const message = {
        content,
        from: socket.user.id,
        to,
        timestamp: new Date(),
      };

      socket.emit('message/group', message);
      chat.participants.forEach((participant) => {
        if (participant.id !== socket.user.id) {
          socket.to(participant.id).emit('message/group', message);
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

  socket.on('disconnect', async () => {
    await UserService.markOffline(socket.user.id);
    logger.debug(`WS ${socket.nsp.name} - ${socket.user.username} closed connection`);

    const privateChats = await ChatService.getPrivateChatsOfUser(socket.user.id);

    privateChats.forEach((chat) => {
      chat.participants.forEach((participant) => {
        if (participant.id !== socket.user.id) {
          socket.to(participant.id).emit('user/offline', socket.user.id);
        }
      });
    });
  });

  socket.conn.on('packet', async (packet) => {
    if (packet.type === 'pong') {
      await UserService.confirmOnline(socket.user.id);
    }
  });
};

export default handler;
