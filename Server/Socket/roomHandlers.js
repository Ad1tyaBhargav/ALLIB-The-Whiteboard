import Room from "../models/Room.js";
import { activeUsers, graceTimers } from "./state.js";

export default function roomHandlers(io, socket,) {

    socket.on("join-room", async ({ roomCode }, callback) => {
        const safeCallback = typeof callback === "function"
            ? callback
            : () => { };

        try {
            const room = await Room.findOne({ roomCode });

            if (!room) {
                safeCallback({
                    success: false,
                    message: "Invalid Room Code"
                });
                return;
            }

            if (room.players.length >= 4) {
                safeCallback({
                    success: false,
                    message: "Room is full (max 4 players)"
                });
                return;
            }

            const userId = socket.user.id;
            const username = socket.user.username;
            const isAdmin = room.adminId === userId;

            if (isAdmin) {
                // Admin rejoined → cancel grace
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
            else {
                // Non-admin trying to join
                if (room.isLocked) {
                    safeCallback({
                        success: false,
                        message: "Room is locked. Admin disconnected."
                    });
                    return;
                }

                const adminCurrentRoom = activeUsers.get(room.adminId);
                if (adminCurrentRoom !== roomCode) {
                    safeCallback({
                        success: false,
                        message: "Admin is not active"
                    });
                    return;
                }
            }

            if (!isAdmin) {
                const adminId = room.adminId;
                const adminCurrentRoom = activeUsers.get(adminId);

                if (!adminCurrentRoom || adminCurrentRoom !== roomCode) {
                    callback({
                        success: false,
                        message: "Admin is not active"
                    });
                    return;
                }
            }

            if (activeUsers.has(userId)) {
                const oldRoom = activeUsers.get(userId);

                if (oldRoom !== roomCode) {
                    socket.to(oldRoom).emit("user-left", { userId, username });

                    await Room.updateOne(
                        { roomCode: oldRoom },
                        { $pull: { players: { userId } } }
                    );

                    socket.leave(oldRoom);
                }
            }

            socket.join(roomCode);
            socket.currentRoom = roomCode;
            activeUsers.set(userId, roomCode);

            await Room.updateOne(
                { roomCode },
                { $pull: { players: { userId } } }
            );

            await Room.updateOne(
                { roomCode },
                {
                    $push: {
                        players: {
                            userId,
                            username,
                            isAdmin
                        }
                    }
                }
            );

            const updatedRoom = await Room.findOne({ roomCode }).select("players boardData");

            socket.emit("player-list", updatedRoom.players);

            console.log(updatedRoom.players)

            socket.emit("board-sync", updatedRoom.boardData);

            socket.to(roomCode).emit("user-joined", {
                username,
                isAdmin
            });

            console.log(`${username} joined room ${roomCode}`);

            callback({
                success: true
            });
        } catch (err) {
            callback({
                success: false,
                message: "Join room failed"
            });
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

                console.log(`🔒 Room ${roomCode} closed`);

                // ✅ NOW tell frontend it’s safe to reset
                callback?.({ ok: true });
            }, 700);

            return;
        }

        // normal player
        await Room.updateOne(
            { roomCode },
            { $pull: { players: { userId } } }
        );

        socket.leave(roomCode);
        socket.currentRoom = null;

        io.to(roomCode).emit("user-left", { userId, username });

        callback?.({ ok: true });
    });



}
