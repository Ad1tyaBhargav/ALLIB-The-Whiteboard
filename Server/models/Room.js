import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  roomCode: { type: String, unique: true },
  adminId: String,
  players: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      username: String,
      isAdmin: {
        type: Boolean,
        default: false,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  createdAt: { type: Date, default: Date.now },
  boardData: { type: Array, default: [] },
  isLocked: { type: Boolean, default: false },
  graceEndsAt: { type: Date, default: null },
  bannedUsers: { type: Array, default: [] },
  mutedUsers: { type: Array, default: [] },
  previewImage: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now, }
});

export default mongoose.model("Room", RoomSchema);
