import io from "../index.js";
import Room from "../models/Room.js";
import { roomCache, roomCursors, graceTimers, activeUsers } from "../Socket/state.js";

async function saveRoomToDB(roomCode) {
    const cache = roomCache.get(roomCode);
    if (!cache) return;

    try {
        await Room.updateOne(
            { roomCode },
            { boardData: cache.boardData }
        );
        console.log(`Room ${roomCode} saved to DB`);
    } catch (err) {
        console.error("Manual save failed:", roomCode);
    }
}

function generateBrightColor(index) {
    const goldenAngle = 137.508;
    const hue = (index * goldenAngle) % 360;

    return `hsl(${hue}, 85%, 60%)`;
}

async function removePlayerFromRoomCache(roomCode, userId) {
    const cache = roomCache.get(roomCode);

    if (cache) {
        //find player in cache
        cache.players = cache.players.filter(p => p.userId !== userId);

        // cleanup user stack
        cache.userStacks.delete(userId);
    }
}

function removePlayerFromCursorCache(roomCode, userId) {
    const cursorMap = roomCursors.get(roomCode);
    console.log("cleaning cursor:", userId)

    if (cursorMap) {
        cursorMap.delete(userId);
        io.to(roomCode).emit("cursor-leave", { userId });
        console.log("removed", userId)

        if (cursorMap.size === 0) {
            roomCursors.delete(roomCode);
        }
    }
}

async function lockRoom(roomCode) {
    await Room.updateOne(
        { roomCode },
        { isLocked: true }
    );
}

function cleanRoomCache(roomCode) {
    roomCache.delete(roomCode);
    graceTimers.delete(roomCode);
    roomCursors.delete(roomCode);
}

async function deleteRoom(roomCode) { 

    try {

        // 1️⃣ Notify all players
        io.to(roomCode).emit("room-closed", {
            message: "Room has been deleted by admin"
        });

        // 2️⃣ Remove sockets from room
        const sockets = await io.in(roomCode).fetchSockets();

        for (const socket of sockets) {
            socket.leave(roomCode);
            socket.currentRoom = null;
        }

        // 3️⃣ Cleanup memory caches
        roomCache?.delete(roomCode);
        roomCursors?.delete(roomCode);
        // chatRateLimiter?.delete(roomCode);

        // 4️⃣ Clear grace timer
        if (graceTimers?.has(roomCode)) {
            clearTimeout(graceTimers.get(roomCode));
            graceTimers.delete(roomCode);
        }

        // 5️⃣ Remove active users mapping
        if (activeUsers) {
            for (const [userId, room] of activeUsers.entries()) {
                if (room === roomCode) {
                    activeUsers.delete(userId);
                }
            }
        }

        // 6️⃣ Delete from DB
        await Room.deleteOne({ roomCode });

        console.log(`Room ${roomCode} fully cleaned`);

    } catch (err) {
        console.error("Room deletion error:", err);
    }

}

export { saveRoomToDB, removePlayerFromRoomCache, generateBrightColor, removePlayerFromCursorCache, lockRoom, cleanRoomCache, deleteRoom }