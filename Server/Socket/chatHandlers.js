export default function chatHandlers(io, socket) {
  socket.on("send-message", ({ roomCode, text }) => {
    io.to(roomCode).emit("receive-message", {
      text,
      username: socket.user.username
    });
  });
}