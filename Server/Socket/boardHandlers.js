import Room from "../models/Room.js";
import cloudinary from "../utils/cloudinary.js"
import { roomCache, roomCursors } from "./state.js";

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
    const cache = roomCache.get(roomCode);
    if (!cache) return;

    const userStack = cache.userStacks.get(socket.user.id);
    if (!userStack) return;

    cache.boardData.push(stroke);

    userStack.undoStack.push(stroke);
    userStack.redoStack = [];

    io.to(roomCode).emit("action-added", { action: stroke });
  });

  socket.on("shape-add", async ({ roomCode, shape }) => {
    const cache = roomCache.get(roomCode);
    if (!cache) return;

    const userStack = cache.userStacks.get(socket.user.id);
    if (!userStack) return;

    cache.boardData.push(shape);

    userStack.undoStack.push(shape);
    userStack.redoStack = [];

    io.to(roomCode).emit("action-added", { action: shape });
  });

  socket.on("undo-action", ({ roomCode }) => {

    const cache = roomCache.get(roomCode);
    if (!cache) return;

    const userStack = cache.userStacks.get(socket.user.id);
    if (!userStack) return;

    const lastAction = userStack.undoStack.pop();
    if (!lastAction) return;

    userStack.redoStack.push(lastAction);

    const index = cache.boardData.findIndex(obj => obj.id === lastAction.id);
    if (index !== -1) {
      cache.boardData.splice(index, 1);
    }

    io.to(roomCode).emit("action-undo", lastAction.id);
  });

  socket.on("redo-action", ({ roomCode }) => {

    const cache = roomCache.get(roomCode);
    if (!cache) return;

    const userStack = cache.userStacks.get(socket.user.id);
    if (!userStack || userStack.redoStack.length === 0) return;

    const action = userStack.redoStack.pop();
    userStack.undoStack.push(action);

    cache.boardData.push(action);

    io.to(roomCode).emit("action-redo", action);
  });

  socket.on("cursor-move", ({ roomCode, x, y }) => {
    const cursorMap = roomCursors.get(roomCode);
    if (!cursorMap) return;

    const userId = socket.user.id;
    const cursor = cursorMap.get(userId);
    if (!cursor) return;

    cursor.x = x;
    cursor.y = y;

    socket.to(roomCode).emit("cursor-move", { userId, x, y });
  });

  socket.on("board-preview", async ({ roomCode, image }) => {
    if (!roomCode || !image) {
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

  socket.on("image-add", ({ roomCode, image }) => {
    const cache = roomCache.get(roomCode);
    if (!cache) return;

    cache.boardData.push(image);

    console.log("got Image")

    io.to(roomCode).emit("action-added", { action: image });
  });

  socket.on("clear-board", async ({ roomCode }) => {
    await Room.updateOne(
      { roomCode },
      { $set: { boardData: [] } }
    );

    io.to(roomCode).emit("clear-board");
  });

}