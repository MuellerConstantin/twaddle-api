// eslint-disable-next-line no-unused-vars
import { Socket } from "socket.io";

import logger from "../../config/logger";
import { SocketError } from "../../middlewares/error";
import * as RoomService from "../../services/rooms";

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
          "twaddle/error",
          new SocketError("Resource not found", "NotFoundError")
        );
        return;
      }

      socket.emit("twaddle/error", new SocketError());
      return;
    }

    socket.join(id);
    await RoomService.addRoomUser(id, socket.user.username);
    logger.debug(
      `WS ${socket.nsp.name} - ${socket.user.username} joined room ${id}`
    );

    const roomUsers = await RoomService.getRoomUsers(id);

    socket.emit("twaddle/room:joined");
    socket.emit("twaddle/room:user-list", { users: roomUsers });

    socket.broadcast.to(id).emit("twaddle/room:user-joined", {
      user: socket.user.username,
    });
    socket.broadcast.to(id).emit("twaddle/room:user-list", {
      users: roomUsers,
    });
  };

  const leaveRoom = async () => {
    const id = await RoomService.getRoomByUsername(socket.user.username);

    if (id) {
      await RoomService.removeRoomUser(id, socket.user.username);
      logger.debug(
        `WS ${socket.nsp.name} - ${socket.user.username} left room ${id}`
      );

      const roomUsers = await RoomService.getRoomUsers();

      socket.emit("twaddle/room:left");

      socket.broadcast.to(id).emit("twaddle/room:user-left", {
        user: socket.user.username,
      });
      socket.broadcast.to(id).emit("twaddle/room:user-list", {
        users: roomUsers,
      });
    }
  };

  socket.on("twaddle/room:join", joinRoom);
  socket.on("twaddle/room:leave", leaveRoom);
  socket.on("disconnect", leaveRoom);
};

export default roomHandler;
