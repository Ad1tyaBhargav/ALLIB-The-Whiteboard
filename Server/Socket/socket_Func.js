import Room from "../models/Room.js";

function ChatMsgHandle({ roomcode, username, msg }) {
    io.to(roomcode).emit("msg", `${username} : ${msg}`);
}

async function DisconnectHandle(roomCode, socket,activeUsers) {
    socket.leave(roomCode);
    const username = socket.user.username;

    console.log(`${username} left room ${roomCode}`);

    await Room.updateOne(
        { roomCode: roomCode },
        { $pull: { players: { username: username } } }
    );

    socket.to(roomCode).emit("user-left", { username });
}

export { ChatMsgHandle, DisconnectHandle }