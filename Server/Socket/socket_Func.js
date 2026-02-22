import Room from "../models/Room.js";
import { roomCache } from "./state.js";

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

export { saveRoomToDB, removePlayerFromCache }