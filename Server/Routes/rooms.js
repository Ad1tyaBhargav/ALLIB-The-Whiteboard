import express from "express";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.options(/.*/, (req, res) => res.sendStatus(200));

router.post("/create-room", authMiddleware, async (req, res) => {
    const roomCode = uuidv4().slice(0, 6).toUpperCase();
    const room = await Room.create({
        roomCode,
        adminId: req.user.id, // ✅ USER ID
        players: [],
        boardData: []
    });

    res.json({
        roomCode,
        adminId: req.user.id
    });
})

router.delete("/delete-room/:roomCode", authMiddleware, async (req, res) => {
    const { roomCode } = req.params;
    const username = req.user.id;

    console.log(`${username} deleted ${roomCode}`)

    const room = await Room.findOne({ roomCode });

    if (!room) {
        console.log("Room Nhi mila")
        return res.status(404).json({ error: "Room not found" });
    }

    if (room.adminId !== username) {
        return res.status(403).json({ error: "Only admin can delete this room" });
    }

    await Room.deleteOne({ roomCode });

    return res.json({
        message: "Room deleted successfully",
        roomCode
    });
})

router.get("/fetch-rooms", authMiddleware, async (req, res) => {
    const UserRooms = await Room.find({ adminId: req.user.id }).select("roomCode previewImage")
    res.json({ UserRooms })
})

export default router;
