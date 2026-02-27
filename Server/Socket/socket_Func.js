import Room from "../models/Room.js";
import { roomCache, roomCursors } from "./state.js";

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

async function removePlayerFromCache(roomCode, userId) {
    const cache = roomCache.get(roomCode);

    if (cache) {
        //find player in cache
        cache.players = cache.players.filter(p => p.userId !== userId);

        // cleanup user stack
        cache.userStacks.delete(userId);
    }
}

function generateBrightColor(index) {
    const goldenAngle = 137.508; 
    const hue = (index * goldenAngle) % 360;

    return `hsl(${hue}, 85%, 60%)`;
}

function cleanCursorCache(io, roomCode, userId) {
    const cursorMap = roomCursors.get(roomCode);
    console.log("cleaning cursor:",userId)

    if (cursorMap) {
        cursorMap.delete(userId);
        io.to(roomCode).emit("cursor-leave", { userId });
        console.log("removed",userId)

        if (cursorMap.size === 0) {
            roomCursors.delete(roomCode);
        }
    }
}

export { saveRoomToDB, removePlayerFromCache, generateBrightColor, cleanCursorCache }