import Room from "../models/Room.js";

export default function chatHandlers(io, socket) {

  socket.on("send-message", async ({ roomCode, message }) => {
    const room = await Room.findOne({ roomCode }).select("mutedUsers");
    if (!room) return;

    if (room.mutedUsers.includes(socket.user.id)) {
      socket.emit("muted-warning", {
        message: "You are muted by admin."
      });
      return;
    }

    io.to(roomCode).emit("receive-message", {
      userId: socket.user.id,
      username: socket.user.username,
      message
    });
  });

  socket.on("toggle-mute", async ({ roomCode, targetUserId }) => {
    const room = await Room.findOne({ roomCode }).select("mutedUsers adminId").lean();
    if (!room) return;

    if (room.adminId !== socket.user.id) return;

    const isMuted = room.mutedUsers.includes(targetUserId);

    if (isMuted) {
      await Room.updateOne(
        { roomCode },
        { $pull: { mutedUsers: targetUserId } }
      );

      io.to(roomCode).emit("user-unmuted", { userId: targetUserId });

    } else {
      await Room.updateOne(
        { roomCode },
        { $push: { mutedUsers: targetUserId } }
      );

      io.to(roomCode).emit("user-muted", { userId: targetUserId });
    }

    
  });

}