import { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../../socket";

const RoomContext = createContext();

export function RoomProvider({ children, toastRef }) {
  const [roomCode, setRoomCode] = useState(null);
  const [players, setPlayers] = useState([]);
  const [boardData, setBoardData] = useState([]);
  const [chats, setChats] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [graceEndsAt, setGraceEndsAt] = useState(null);
  const [cursors, setCursors] = useState({});
  const [admin, setAdmin] = useState(null);
  const [viewport, setViewport] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  const showToast = (severity, summary, detail) => {
    toastRef?.current?.show({
      severity,
      summary,
      detail,
      life: 3000
    });
  };

  function joinRoom(roomCode) {
    socket.emit("join-room", { roomCode }, (res) => {
      if (!res.success) {
        localStorage.removeItem("lastRoomCode");
        showToast("danger", "Unable to connect", `${res.message} `);
        return;
      }
      localStorage.setItem("lastRoomCode", roomCode);
      setRoomCode(roomCode);
    });


  }

  function leaveRoom() {
    socket.emit("leave-room", (response) => {
      if (response?.ok) {
        resetRoomState(); // ✅ safe now
      }
    });
  }

  const resetRoomState = () => {
    setRoomCode(null);
    setPlayers([]);
    setBoardData([]);
    setChats([]);
    setIsLocked(false);
    setGraceEndsAt(null);

    localStorage.removeItem("lastRoomCode");
  };

  useEffect(() => {
    if (!socket) return;

    const handlePlayerList = ({players,admin}) => {
      setPlayers(players);
      setAdmin(admin.username);
    };

    const handleUserJoined = (player) => {
      setPlayers(prev => {
        if (prev.some(p => p.userId === player.userId)) return prev;
        return [...prev, player];
      });
      showToast("info", "User Joined", `${player.username} joined the room`);
    };

    const handleUserLeft = ({ userId, username }) => {
      setPlayers(prev => prev.filter(p => p.userId !== userId));
      showToast("info", "User left", `${username} left the room`);
    };

    const handleRoomClosed = ({ message }) => {
      showToast(
        "warn",
        "Room closed",
        "Admin disconnected and did not return"
      );
      resetRoomState();
    }

    const handleBoardSync = (data) => {
      setBoardData(data);
    };

    const handleReceiveMessage = (msg) => {
      setChats(prev => [...prev, msg]);
      showToast("info", "New message", `${msg.username} sent a message`);
    };

    const handleGraceStart = ({ graceEndsAt }) => {
      setIsLocked(true);
      setGraceEndsAt(new Date(graceEndsAt));

      if (socket.isAdmin) {
        socket.emit("request-board-preview");
      }

      showToast("warn", "Admin disconnected", "Room locked temporarily");
    }

    const handleGraceCancel = () => {
      setIsLocked(false);
      setGraceEndsAt(null);
      showToast("success", "Admin returned", "Room unlocked");
    }

    const handleStrokeStart = ({ stroke }) => {
      setBoardData(prev => [...prev, stroke]);
    };

    const handleStrokeUpdate = ({ id, points }) => {
      setBoardData(prev =>
        prev.map(el =>
          el.id === id ? { ...el, points } : el
        )
      );
    };

    const handleStrokeEnd = ({ stroke }) => {
      setBoardData(prev =>
        prev.map(el =>
          el.id === stroke.id ? stroke : el
        )
      );
    };

    const handleCursorMove = ({ userId, username, x, y }) => {
      setCursors(prev => ({
        ...prev,
        [userId]: { x, y, username }
      }));
    };

    const handleCursorLeave = ({ userId }) => {
      setCursors(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    };

    const handleShapeAdd = ({ shape }) => {
      setBoardData(prev => [...prev, shape]);
    };

    socket.on("player-list", handlePlayerList);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-closed", handleRoomClosed);

    socket.on("board-sync", handleBoardSync);
    socket.on("stroke-start", handleStrokeStart);
    socket.on("stroke-update", handleStrokeUpdate);
    socket.on("stroke-end", handleStrokeEnd);
    socket.on("shape-add", handleShapeAdd);

    socket.on("room-grace-start", handleGraceStart);
    socket.on("room-grace-cancel", handleGraceCancel);

    socket.on("receive-message", handleReceiveMessage);

    socket.on("cursor-move", handleCursorMove);
    socket.on("cursor-leave", handleCursorLeave);

    return () => {
      socket.off("player-list", handlePlayerList);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("room-closed", handleRoomClosed);

      socket.off("board-sync", handleBoardSync);
      socket.off("stroke-start", handleStrokeStart);
      socket.off("stroke-update", handleStrokeUpdate);
      socket.off("stroke-end", handleStrokeEnd);
      socket.off("shape-add", handleShapeAdd);

      socket.off("room-grace-start", handleGraceStart);
      socket.off("room-grace-cancel", handleGraceCancel);

      socket.off("receive-message", handleReceiveMessage);

      socket.off("cursor-move", handleCursorMove);
      socket.off("cursor-leave", handleCursorLeave);
    };
  }, []);

  return (
    <RoomContext.Provider
      value={{
        roomCode,
        players,
        admin,

        boardData,
        setBoardData,

        chats,

        cursors,
        viewport,
        setViewport,

        joinRoom,
        leaveRoom,

        isLocked,
        graceEndsAt,

        resetRoomState,
        showToast
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
