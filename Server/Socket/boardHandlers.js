import Room from "../models/Room.js";

export default function boardHandlers(io, socket) {
  socket.on("board-draw", async ({ roomCode, element }) => {
  await Room.updateOne(
    { roomCode },
    { $push: { boardData: element } }
  );

  socket.to(roomCode).emit("board-draw", element);
});

socket.on("clear-board", async ({ roomCode }) => {
  await Room.updateOne(
    { roomCode },
    { $set: { boardData: [] } }
  );

  io.to(roomCode).emit("clear-board");
});

}