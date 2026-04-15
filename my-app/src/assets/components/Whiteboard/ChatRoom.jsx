import React, { useState } from "react";
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
  const { chats, isLocked, roomCode, mutedUsers, staticCursors } = useRoom();

  const isMuted = mutedUsers.includes(user);
  const inputDisabled = isLocked || isMuted;

  function sendMsg() {
    if (!input.trim() || inputDisabled) return;

    socket.emit("send-message", {
      roomCode,
      message: input
    });

    setInput("");
  }

  function renderChat(msg, index) {
    return (
      <ChatMessage
        key={`${msg.userId}-${index}`}
        username={msg.username}
        message={msg.message}
        avatar={staticCursors[msg.userId]?.avatar}
        isSelf={msg.userId === user}
      />
    );
  }

  return (
    <>
      <SpeedDial
        radius={120}
        direction="up"
        buttonClassName="bg-dark rounded-circle chatroom-trigger"
        style={{
          right: "max(1rem, env(safe-area-inset-right, 0px))",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
          position: "fixed",
          zIndex: 9998
        }}
        onClick={() => setShowChat(true)}
        showIcon="pi pi-comments"
      />

      {showChat && (
        <div id="chatroom">
          <div id="chatroom-header">
            <span>Chat Room</span>
            <Button icon="pi pi-times" className="rounded" onClick={() => setShowChat(false)} />
          </div>

          <div id="chatroom-body">
            <p className="chatroom-welcome">Welcome to the chat!</p>
            {chats.map(renderChat)}
          </div>

          <div id="chatroom-input">
            <input
              disabled={inputDisabled}
              type="text"
              placeholder={
                isLocked
                  ? "Room locked"
                  : isMuted
                    ? "You are muted"
                    : "Type a message..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMsg();
                }
              }}
            />
            <button onClick={sendMsg} disabled={inputDisabled}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
