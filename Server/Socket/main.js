import roomHandlers from "./roomHandlers.js";
import boardHandlers from "./boardHandlers.js";
import chatHandlers from "./chatHandlers.js";
import Room from "../models/Room.js";
import { activeUsers, graceTimers, roomCache } from "./state.js";
import { saveRoomToDB, removePlayerFromCache } from "./socket_Func.js";

export default function socketHandlers(io) {

  io.on("connection", (socket) => {
    console.log("Socket connected with auth:", socket.user.username);

    roomHandlers(io, socket);
    boardHandlers(io, socket);
    chatHandlers(io, socket);

    setInterval(async () => {
      for (const [roomCode, cache] of roomCache.entries()) {
        try {
          await Room.updateOne(
            { roomCode },
            { boardData: cache.boardData }
          );
        } catch (err) {
          console.error("Auto-save failed for room:", roomCode);
        }
      }
    }, 10000);

    const GRACE_MS = 30_000;

    //Fix disconnect socket for caching
    socket.on("disconnect", async () => {
      const userId = socket.user?.id;
      const roomCode = socket.currentRoom;
      const username = socket.user.username;
      const cache = roomCache.get(roomCode);
      if (!roomCode) return;

      const room = await Room.findOne({ roomCode });
      if (!room) return;

      activeUsers.delete(userId);
      removePlayerFromCache(roomCode, userId);

      // 👑 ADMIN DISCONNECTED → START GRACE
      if (room.adminId === userId) {
        console.log("Admin disconnected → grace started");

        await Room.updateOne(
          { roomCode },
          {
            boardData:cache.boardData,
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

          roomCache.delete(roomCode);
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