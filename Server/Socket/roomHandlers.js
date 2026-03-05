import Room from "../models/Room.js";
import User from "../models/User.js";
import { activeUsers, graceTimers, roomCache, roomCursors } from "./state.js";
import { saveRoomToDB, removePlayerFromRoomCache, generateBrightColor, removePlayerFromCursorCache, lockRoom, cleanRoomCache } from "./socket_Func.js";

export default function roomHandlers(io, socket,) {

    socket.on("join-room", async ({ roomCode }, callback) => {
        const safeCallback = typeof callback === "function" ? callback : () => { };

        try {
            let room = await Room.findOne({ roomCode }).lean();

            if (!room) {
                return safeCallback({ success: false, message: "Invalid Room Code" });
            }

            // 🔥 LOAD FROM CACHE FIRST
            if (!roomCache.has(roomCode)) {

                roomCache.set(roomCode, {
                    boardData: room.boardData || [],
                    players: room.players || [],
                    userStacks: new Map()
                });
            }

            const cache = roomCache.get(roomCode);


            const userId = socket.user.id;
            const username = socket.user.username;
            const isAdmin = room.adminId === userId;

            const user = await User.findById(userId).select("avatar").lean();
            const avatarUrl = user?.avatar || null;

            // 🚫 Ban check
            if (room.bannedUsers.includes(userId)) {
                return safeCallback({ success: false, message: "You are banned from this room." });
            }

            // 🚫 Room full
            if (cache.players.length >= 4) {
                return safeCallback({ success: false, message: "Room is full (max 4 players)" });
            }

            if (isAdmin) {

                if (graceTimers.has(roomCode)) {
                    clearTimeout(graceTimers.get(roomCode));
                    graceTimers.delete(roomCode);
                }

                await Room.updateOne(
                    { roomCode },
                    { isLocked: false, graceEndsAt: null }
                );

                io.to(roomCode).emit("room-grace-cancel");
            }

            if (!isAdmin) {
                if (room.isLocked) {
                    return safeCallback({
                        success: false,
                        message: "Room is locked. Admin disconnected."
                    });
                }

                // Extra safety:
                if (graceTimers.has(roomCode)) {
                    return safeCallback({
                        success: false,
                        message: "Room temporarily locked (admin grace period)."
                    });
                }
            }

            // 🧠 Initialize user stack
            if (!cache.userStacks.has(userId)) {
                cache.userStacks.set(userId, {
                    undoStack: [],
                    redoStack: []
                });
            }

            // 🟢 Join room
            socket.join(roomCode);
            socket.currentRoom = roomCode;
            activeUsers.set(userId, roomCode);

            // 🔄 Update players in cache
            cache.players = cache.players.filter(p => p.userId !== userId);
            cache.players.push({ userId, username, avatarUrl, isAdmin });

            // 🔥 SINGLE DB UPDATE (atomic)
            await Room.updateOne(
                { roomCode },
                {
                    $pull: { players: { userId } }
                }
            );

            await Room.updateOne(
                { roomCode },
                {
                    $push: {
                        players: { userId, username, isAdmin }
                    }
                }
            );

            if (!roomCursors.has(roomCode)) {
                roomCursors.set(roomCode, new Map());
            }

            const cursorMap = roomCursors.get(roomCode);
            const cursorCount = cursorMap.size;

            const cursor = {
                userId,
                avatarUrl,
                x: 0,
                y: 0,
                color: generateBrightColor(cursorCount)
            };

            cursorMap.set(userId, cursor);

            // 📡 Emit using CACHE
            socket.emit("player-list", {
                players: cache.players,
                admin: cache.players.find(p => p.isAdmin)
            });

            socket.emit("muted-list", room.mutedUsers);

            socket.emit("board-sync", cache.boardData);

            socket.emit("cursor-sync", Array.from(cursorMap.values()));

            socket.to(roomCode).emit("user-joined", {
                userId,
                username,
                avatarUrl,
                isAdmin
            });

            socket.to(roomCode).emit("cursor-new", cursor);

            console.log(`${username} joined room ${roomCode}`);

            safeCallback({ success: true });

        } catch (err) {
            console.error(err);
            safeCallback({ success: false, message: "Join room failed" });
        }
    });

    socket.on("leave-room", async (callback) => {
        const userId = socket.user.id;
        const username = socket.user.username;
        const roomCode = socket.currentRoom;

        if (!roomCode) {
            callback?.({ ok: true });
            return;
        }

        const room = await Room.findOne({ roomCode });
        if (!room) {
            callback?.({ ok: true });
            return;
        }

        const isAdmin = room.adminId === userId;

        if (isAdmin) {
            // 🔴 ask admin to send preview
            socket.emit("request-board-preview");

            // wait for preview to arrive (short grace)
            setTimeout(async () => {
                io.to(roomCode).emit("room-closed", {
                    message: "Admin left the room"
                });

                await Room.updateOne(
                    { roomCode },
                    { $set: { players: [] } }
                );

                const sockets = await io.in(roomCode).fetchSockets();
                for (const s of sockets) {
                    s.leave(roomCode);
                    s.currentRoom = null;
                }

                await saveRoomToDB(roomCode);

                
                console.log(`🔒 Room ${roomCode} closed`);
                
                // ✅ NOW tell frontend it’s safe to reset
                callback?.({ ok: true });
            }, 700);
            
            cleanRoomCache(roomCode)
            lockRoom(roomCode)

            return;
        }

        // normal player
        await Room.updateOne(
            { roomCode },
            { $pull: { players: { userId } } }
        );

        removePlayerFromRoomCache(roomCode, userId);
        removePlayerFromCursorCache(io, roomCode, userId);

        socket.leave(roomCode);
        socket.currentRoom = null;

        io.to(roomCode).emit("user-left", { mode: "left", userId, username });

        callback?.({ ok: true });
    });

    socket.on("kick-user", async ({ roomCode, targetUserId }) => {
        const room = await Room.findOne({ roomCode });
        if (!room) return;

        console.log(`Attempting to kick user ${targetUserId} from room ${roomCode}`);

        // 🔒 Only admin can kick
        if (room.adminId !== socket.user.id) return;

        // Remove from DB players list
        await Room.updateOne(
            { roomCode },
            { $pull: { players: { userId: targetUserId } } }
        );

        removePlayerFromRoomCache(roomCode, targetUserId);
        removePlayerFromCursorCache(io, roomCode, userId);

        // Find target socket
        const sockets = await io.in(roomCode).fetchSockets();
        const targetSocket = sockets.find(
            s => s.user.id === targetUserId
        );

        if (targetSocket) {
            targetSocket.emit("kicked", {
                message: "You were kicked by the admin."
            });

            targetSocket.leave(roomCode);
            targetSocket.currentRoom = null;
        }

        io.to(roomCode).emit("user-left", { mode: "kicked", userId: targetUserId, username: targetSocket ? targetSocket.user.username : "A user" });
    });

    socket.on("ban-user", async ({ roomCode, targetUserId }) => {
        const room = await Room.findOne({ roomCode }).select("adminId").lean();
        if (!room) return;

        if (room.adminId !== socket.user.id) return;

        await Room.updateOne(
            { roomCode },
            {
                $pull: { players: { userId: targetUserId } },
                $addToSet: { bannedUsers: targetUserId }
            }
        );

        removePlayerFromRoomCache(roomCode, targetUserId);
        removePlayerFromCursorCache(io, roomCode, userId);

        const sockets = await io.in(roomCode).fetchSockets();
        const targetSocket = sockets.find(
            s => s.user.id === targetUserId
        );

        if (targetSocket) {
            targetSocket.emit("banned", {
                message: "You were banned from this room."
            });

            targetSocket.leave(roomCode);
            targetSocket.currentRoom = null;
        }

        io.to(roomCode).emit("user-left", { mode: "banned", userId: targetUserId, username: targetSocket ? targetSocket.user.username : "A user" });
    });

}
