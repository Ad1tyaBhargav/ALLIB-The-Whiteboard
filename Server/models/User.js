import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
