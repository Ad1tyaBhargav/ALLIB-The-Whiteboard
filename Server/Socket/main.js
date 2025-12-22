import roomHandlers from "./roomHandlers.js";
import boardHandlers from "./boardHandlers.js";
import chatHandlers from "./chatHandlers.js";
import Room from "../models/Room.js";
import { activeUsers, graceTimers } from "./state.js";

export default function socketHandlers(io) {

  io.on("connection", (socket) => {
    console.log("Socket connected with auth:", socket.user.username);

    roomHandlers(io, socket,);
    boardHandlers(io, socket);
    chatHandlers(io, socket);

    const GRACE_MS = 30_000;

    socket.on("disconnect", async () => {
      const userId = socket.user?.id;
      const roomCode = socket.currentRoom;
      const username =socket.user.username;
      if (!roomCode) return;

      const room = await Room.findOne({ roomCode });
      if (!room) return;

      activeUsers.delete(userId);

      // 👑 ADMIN DISCONNECTED → START GRACE
      if (room.adminId === userId) {
        console.log("Admin disconnected → grace started");

        await Room.updateOne(
          { roomCode },
          {
            isLocked: true,
            graceEndsAt: new Date(Date.now() + GRACE_MS)
          }
        );

        io.to(roomCode).emit("room-grace-start", {
          graceEndsAt: Date.now() + GRACE_MS
        });

        const timer = setTimeout(async () => {
          const freshRoom = await Room.findOne({ roomCode });

          // ❗ Admin returned → cancel
          if (!freshRoom || !freshRoom.isLocked) return;

          console.log("Grace expired → closing room");

          // 🔥 FORCE CLOSE ROOM
          io.to(roomCode).emit("room-closed", {
            reason: "ADMIN_LEFT"
          });

          await Room.updateOne(
            { roomCode },
            {
              players: [],
              isLocked: false,
              graceEndsAt: null
            }
          );

          const sockets = await io.in(roomCode).fetchSockets();
          for (const s of sockets) {
            activeUsers.delete(s.user.id);
            s.leave(roomCode);
            s.currentRoom = null;
          }

          graceTimers.delete(roomCode);
        }, GRACE_MS);

        graceTimers.set(roomCode, timer);
      }

      await Room.updateOne(
        { roomCode },
        { $pull: { players: { userId } } }
      );

      socket.to(roomCode).emit("user-left", {
        userId,
        username
      });
    });

  });
}