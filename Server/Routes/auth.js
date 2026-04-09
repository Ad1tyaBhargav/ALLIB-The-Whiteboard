import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";

dotenv.config()

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.options(/.*/, (req, res) => res.sendStatus(200));

router.post("/signup", [
  body("username").isAlphanumeric().isLength({ min: 4 }),
  body("password").isLength({ min: 6 }),
  body("email").isEmail().normalizeEmail()
],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ error: "Invalid input" });
    }
    const { username, password, email } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ username, password: hashed, email, avatar: null });

    return res.json({ message: "Account created", user: user.username, status: "200" });
  });

router.post("/login", [
  body("username").isAlphanumeric().isLength({ min: 4 }),
  body("password").isLength({ min: 6 }),
],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ error: "Invalid input" });
    }
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.json({ error: "Invalid username or password" });
    if (!user.password) return res.json({ error: "Use Google login" });

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

router.post("/google", async (req, res) => {
  const { email, username, avatar, googleId } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user && !user.googleId) {
      return res.status(400).json({
        error: "Email already registered with password"
      });
    }

    if (!user) {
      user = await User.create({
        email,
        username,
        avatar,
        googleId
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, username: user.username });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
