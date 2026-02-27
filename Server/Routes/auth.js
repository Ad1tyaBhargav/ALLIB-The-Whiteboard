import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config()

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.options(/.*/, (req, res) => res.sendStatus(200));

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  console.log(username + " " + password)

  const existingUser = await User.findOne({ username });
  if (existingUser) return res.json({ error: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({ username, password: hashed });

  return res.json({ message: "Account created", user: user.username, status: "200" });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ error: "Invalid username or password" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.json({ error: "Invalid username or password" });

  const token = jwt.sign(
    { id: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ message: "Login success", token, username: user.username, status: "200" });
});

router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
