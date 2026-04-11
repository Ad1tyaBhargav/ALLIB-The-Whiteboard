import Room from "../models/Room.js";
import boardHandlers from "./boardHandlers.js";
import chatHandlers from "./chatHandlers.js";
import roomHandlers from "./roomHandlers.js";
import { cleanRoomCache, removePlayerFromCursorCache, removePlayerFromRoomCache } from "../services/Server_Functions.js";
import { activeUsers, graceTimers, roomCache, strokeThrottle } from "./state.js";

export default function socketHandlers(io) {

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

  io.on("connection", (socket) => {
    console.log("Socket connected with auth:", socket.user.username);

    roomHandlers(io, socket);
    boardHandlers(io, socket);
    chatHandlers(io, socket);



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


      // 👑 ADMIN DISCONNECTED → START GRACE
      if (room.adminId === userId) {
        console.log("Admin disconnected → grace started");

        await Room.updateOne(
          { roomCode },
          {
            boardData: cache.boardData,
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
            messagee: "Admin didnt return."
          });

          await Room.updateOne(
            { roomCode },
            {
              players: [],
              isLocked: true,
              graceEndsAt: null
            }
          );

          const sockets = await io.in(roomCode).fetchSockets();
          for (const s of sockets) {
            activeUsers.delete(s.user.id);
            s.leave(roomCode);
            s.currentRoom = null;
          }

          cleanRoomCache(roomCode)
        }, GRACE_MS);

        graceTimers.set(roomCode, timer);
      }

      await Room.updateOne(
        { roomCode },
        { $pull: { players: { userId } } }
      );

      removePlayerFromRoomCache(roomCode, userId);
      removePlayerFromCursorCache(roomCode, userId);
      strokeThrottle.delete(socket.id);

      socket.to(roomCode).emit("cursor-leave", {
        userId
      });

      socket.to(roomCode).emit("user-left", {
        userId,
        username
      });
    });

  });
}