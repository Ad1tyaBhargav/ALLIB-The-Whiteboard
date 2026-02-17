import Room from "../models/Room.js";
import cloudinary from "../utils/cloudinary.js"

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

  socket.on("shape-add", async ({ roomCode, shape }) => {
    await Room.updateOne(
      { roomCode },
      { $push: { boardData: shape } }
    );

    socket.to(roomCode).emit("shape-add", { shape });
  });

  socket.on("cursor-move", ({ roomCode, x, y, username }) => {
    socket.to(roomCode).emit("cursor-move", {
      userId: socket.userId,
      username,
      x,
      y
    });
  });

  socket.on("cursor-leave", ({ roomCode }) => {
    socket.to(roomCode).emit("cursor-leave", {
      userId: socket.userId
    });
  });

  socket.on("board-preview", async ({ roomCode, image }) => {
    if (!roomCode || !image){
      console.log(roomCode)
      console.log(image)
      return;
    } 

    try {
      const room = await Room.findOne({ roomCode });
      if (!room) {
        console.warn("Preview skipped: room not found", roomCode);
        return;
      }

      const upload = await cloudinary.uploader.upload(image, {
        folder: "board-previews",
        resource_type: "image",
      });

      await Room.updateOne(
        { roomCode },
        {
          $set: {
            previewImage: upload.secure_url,
            updatedAt: new Date(),
          }
        }
      );

      console.log("✅ Board preview saved to DB:", upload.secure_url);

    } catch (err) {
      console.error("❌ Board preview save failed:", err);
    }
  });


  socket.on("clear-board", async ({ roomCode }) => {
    await Room.updateOne(
      { roomCode },
      { $set: { boardData: [] } }
    );

    io.to(roomCode).emit("clear-board");
  });

}