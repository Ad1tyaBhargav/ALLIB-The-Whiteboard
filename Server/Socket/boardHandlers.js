import Room from "../models/Room.js";

export default function boardHandlers(io, socket) {
  // stroke starts (DO NOT save to DB)
  socket.on("stroke-start", ({ roomCode, stroke }) => {
    socket.to(roomCode).emit("stroke-start", { stroke });
  });

  // stroke updates (DO NOT save to DB)
  socket.on("stroke-update", ({ roomCode, id, points }) => {
    socket.to(roomCode).emit("stroke-update", { id, points });
  });

  // stroke ends (SAVE ONCE)
  socket.on("stroke-end", async ({ roomCode, stroke }) => {
    await Room.updateOne(
      { roomCode },
      { $push: { boardData: stroke } }
    );

    socket.to(roomCode).emit("stroke-end", { stroke });
  });

  socket.on("clear-board", async ({ roomCode }) => {
    await Room.updateOne(
      { roomCode },
      { $set: { boardData: [] } }
    );

    io.to(roomCode).emit("clear-board");
  });

}