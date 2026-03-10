import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import authRoutes from "./Routes/auth.js";
import roomRoutes from "./Routes/rooms.js"
import socketHandlers from "./Socket/main.js";
import connectDB from "./utils/database.js";
import userRoutes from "./Routes/avatarupload.js"

const app = express();
const server = createServer(app);

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://allib-the-whiteboard.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))

app.options(/.*/, cors());

app.use(express.json())

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://allib-the-whiteboard.vercel.app"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

dotenv.config()

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token")); 

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = user;
        next();
    } catch (err) {
        next(new Error("Invalid token"));
    }
})

connectDB();

app.use("/room", roomRoutes)

const rooms = {}

app.use("/auth", authRoutes);

app.use("/user",userRoutes);

export default io;

socketHandlers(io)

server.listen(5000, () => console.log("Server running on port 5000"));