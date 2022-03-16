// eslint-disable-next-line no-unused-vars
import { Socket } from "socket.io";

import logger from "../../config/logger";
import { SocketError, SocketErrorCode } from "../../middlewares/error";
import * as RoomService from "../../services/rooms";
import * as MessageService from "../../services/messages";

/**
 * General events that apply to all domains.
 */
export const GeneralEvent = {
  DISCONNECT: "disconnect",
  ERROR: "twaddle/error",
};

/**
 * Events used in the room domain.
 */
export const RoomEvent = {
  JOIN: "twaddle/room:join",
  LEAVE: "twaddle/room:leave",
  SEND: "twaddle/room:send",
  JOINED: "twaddle/room:joined",
  LEFT: "twaddle/room:left",
  USER_LIST: "twaddle/room:user-list",
  USER_LEFT: "twaddle/room:user-left",
  USER_JOINED: "twaddle/room:user-joined",
  MESSAGE: "twaddle/room:message",
};

/**
 * Room handler for handling all room related operations.
 *
 * @param {Socket} socket Incoming socket connection
 */
const roomHandler = (socket) => {
  const joinRoom = async ({ id }) => {
    try {
      await RoomService.findById(id);
    } catch (err) {
      if (err.code === "NotFoundError") {
        socket.emit(
          GeneralEvent.ERROR,
          new SocketError("Resource not found", SocketErrorCode.NOT_FOUND_ERROR)
        );
        return;
      }

      socket.emit(GeneralEvent.ERROR, new SocketError());
      return;
    }

    socket.join(id);
    await RoomService.addRoomUser(id, socket.user.username);
    logger.debug(
      `WS ${socket.nsp.name} - ${socket.user.username} joined room ${id}`
    );

    const roomUsers = await RoomService.getRoomUsers(id);

    socket.emit(RoomEvent.JOINED);
    socket.emit(RoomEvent.USER_LIST, { users: roomUsers });

    socket.broadcast.to(id).emit(RoomEvent.USER_JOINED, {
      user: socket.user.username,
    });
    socket.broadcast.to(id).emit(RoomEvent.USER_LIST, {
      users: roomUsers,
    });
  };

  /**
   * Handles the case when a client wants to leave the room.
   */
  const leaveRoom = async () => {
    const id = await RoomService.getRoomByUsername(socket.user.username);

    if (id) {
      await RoomService.removeRoomUser(id, socket.user.username);
      logger.debug(
        `WS ${socket.nsp.name} - ${socket.user.username} left room ${id}`
      );

      const roomUsers = await RoomService.getRoomUsers(id);

      // Confirms to the client that he has successfully left the room
      socket.emit(RoomEvent.LEFT);

      // Informs all other clients about leaving
      socket.broadcast.to(id).emit(RoomEvent.USER_LEFT, {
        user: socket.user.username,
      });

      // Sends an updated user list
      socket.broadcast.to(id).emit(RoomEvent.USER_LIST, {
        users: roomUsers,
      });
    }
  };

  /**
   * Responsible for receiving messages to be sent. These are then distributed
   * equally to all clients in the room.
   *
   * @param {{message: string}} properties Properties of message to broadcast
   */
  const broadcastMessage = async ({ message }) => {
    const id = await RoomService.getRoomByUsername(socket.user.username);

    if (id) {
      const newMessage = await MessageService.create({
        content: message,
        room: id,
        // eslint-disable-next-line no-underscore-dangle
        user: socket.user._id.toString(),
      });

      // Acknowledges its own message to the sender
      socket.emit(RoomEvent.MESSAGE, newMessage);

      // Broadcasts the message to all other clients
      socket.broadcast.to(id).emit(RoomEvent.MESSAGE, newMessage);

      logger.debug(
        `WS ${socket.nsp.name} - ${socket.user.username} send message to room ${id}`
      );
    } else {
      socket.emit(
        GeneralEvent.ERROR,
        new SocketError(
          "There is no connection to a chat room",
          SocketErrorCode.NO_ROOM_ASSOCIATED_ERROR
        )
      );

      logger.debug(
        `WS ${socket.nsp.name} - ${socket.user.username} tried to send message outside of chat room`
      );
    }
  };

  socket.on(RoomEvent.JOIN, joinRoom);
  socket.on(RoomEvent.LEAVE, leaveRoom);
  socket.on(RoomEvent.SEND, broadcastMessage);
  socket.on(GeneralEvent.DISCONNECT, leaveRoom);
};

export default roomHandler;
