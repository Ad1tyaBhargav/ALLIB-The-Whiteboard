import React, { useState, useRef, useEffect } from "react";
import { SpeedDial } from "primereact/speeddial";
import { Button } from "primereact/button";
import { useRoom } from "../../context/RoomContext";
import { socket } from "../../../socket";
import ChatMessage from "./components/ChatMessage";

import "primereact/resources/themes/soho-dark/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function Chatroom({ user }) {

    const [showChat, setShowChat] = useState(false);
    const [input, setInput] = useState("");
    const { chats, isLocked, roomCode, mutedUsers, staticCursors } = useRoom()

    const isMuted = mutedUsers.includes(user);

    function displayChat() {
        setShowChat(true)
    }

    function sendMsg() {
        if (!input.trim()) return;

        socket.emit("send-message", {
            roomCode,
            message: input
        });

        setInput("");
    }

    function displayChat(msg, index) {
        return (
            <>
                <ChatMessage
                    key={index*286}
                    username={msg.username}
                    message={msg.message}
                    avatar={staticCursors[msg.userId]?.avatar}
                    isSelf={msg.userId === user}
                />
            </>
        )
    }

    return (
        <>

            {/* Floating button */}
            <SpeedDial
                radius={120}
                direction="up"
                buttonClassName="bg-dark rounded-circle"
                showIcon="pi pi-comments"
                style={{ right: "2rem", bottom: "2rem", position: "absolute", zIndex: "9998" }}
                onClick={() => setShowChat(true)}
            />

            {/* Chatroom overlay */}
            {showChat && (
                <div id="chatroom" >
                    <div id="chatroom-header" >
                        Chat Room
                        <Button icon="pi pi-times" className="rounded" onClick={() => setShowChat(false)} />
                    </div>

                    <div id="chatroom-body">
                        <p>Welcome to the chat!</p>
                        {chats.map(displayChat)}
                    </div>

                    <div id="chatroom-input">
                        <input
                            disabled={isLocked}
                            type="text"
                            placeholder={isLocked ? "Room Locked" : "Type a message..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button onClick={sendMsg}>Send</button>
                    </div>
                </div>
            )}
        </>
    );
}
