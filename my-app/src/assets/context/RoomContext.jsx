import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { socket } from "../../socket";

const RoomContext = createContext();
const DEFAULT_VIEWPORT = {
  scale: 1,
  x: 0,
  y: 0,
};

export function RoomProvider({ children, toastRef }) {
  const [roomCode, setRoomCode] = useState(null);
  const [players, setPlayers] = useState([]);
  const [boardData, setBoardData] = useState([]);
  const [chats, setChats] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [graceEndsAt, setGraceEndsAt] = useState(null);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [staticCursors, setStaticCursors] = useState({});
  const cursorsRef = useRef({});
  const [admin, setAdmin] = useState(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);

  const showToast = useCallback((severity, summary, detail) => {
    toastRef?.current?.show({
      severity,
      summary,
      detail,
      life: 3000
    });
  }, [toastRef]);

  function joinRoom(roomCode, isNew) {
    socket.emit("join-room", { roomCode }, (res) => {
      if (!res.success) {
        localStorage.removeItem("lastRoomCode");
        showToast("error", "Unable to connect", res.message);
        return;
      }

      localStorage.setItem("lastRoomCode", roomCode);
      showToast(
        "success",
        isNew ? "Room created" : "Room joined",
        `${isNew ? "Room created" : "Room joined"}: ${roomCode}`
      );
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

  const controlUser = (action, roomCode, targetUserId) => {
    socket.emit(`${action}`, {
      roomCode,
      targetUserId,
    });
  };

  const resetRoomState = useCallback(() => {
    setRoomCode(null);
    setPlayers([]);
    setBoardData([]);
    setChats([]);
    setIsLocked(false);
    setGraceEndsAt(null);
    setMutedUsers([]);
    setStaticCursors({});
    cursorsRef.current = {};
    setAdmin(null);
    setViewport(DEFAULT_VIEWPORT);

    localStorage.removeItem("lastRoomCode");
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerList = ({ players, admin }) => {
      setPlayers(players);
      setAdmin(admin?.userId ?? null);
    };

    const handleUserJoined = (player) => {
      setPlayers(prev => {
        if (prev.some(p => p.userId === player.userId)) return prev;
        return [...prev, player];
      });
      showToast("info", "User Joined", `${player.username} joined the room`);
    };

    const handleUserLeft = ({ mode, userId, username }) => {
      setPlayers(prev => prev.filter(p => p.userId !== userId));
      mode === "left" && showToast("info", "User left", `${username} left the room`);
      mode === "kicked" && showToast("warn", "User kicked", `${username} was kicked`);
      mode === "banned" && showToast("warn", "User banned", `${username} was banned`);
    };

    const handleKicked = ({ message }) => {
      showToast("warn", "Kicked from room", message);
      resetRoomState();
    };

    const handleRoomClosed = ({ message, messagee }) => {
      showToast(
        "warn",
        "Room closed",
        message ?? messagee ?? "The room was closed."
      );
      resetRoomState();
    };

    const handleBoardSync = (data) => {
      setBoardData(Array.isArray(data) ? data : []);
    };

    const handleReceiveMessage = (msg) => {
      setChats(prev => [...prev, msg]);
      showToast("info", "New message", `${msg.username} sent a message`);
    };

    const handleSpamWarning = ({ message }) => {
      showToast("warn", "Slow down", message);
    };

    const handleGraceStart = ({ graceEndsAt }) => {
      setIsLocked(true);
      setGraceEndsAt(new Date(graceEndsAt));

      showToast("warn", "Admin disconnected", "Room locked temporarily");
    };

    const handleGraceCancel = () => {
      setIsLocked(false);
      setGraceEndsAt(null);
      showToast("success", "Admin returned", "Room unlocked");
    };

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

    const handleActionAdded = ({ action }) => {
      setBoardData(prev => {
        // Remove temporary version if exists
        const filtered = prev.filter(el => el.id !== action.id);
        return [...filtered, action];
      });
    };

    const handleActionUndo = (actionId) => {
      setBoardData(prev => prev.filter(obj => obj.id !== actionId));
    };

    const handleActionRedo = (action) => {
      setBoardData(prev => {
        const filtered = prev.filter(el => el.id !== action.id);
        return [...filtered, action];
      });
    };

    const handleCursorSync = (cursorList) => {
      const staticData = {};
      const liveData = {};

      cursorList.forEach(c => {
        staticData[c.userId] = {
          userId: c.userId,
          avatar: c.avatarUrl,
          color: c.color,
          username: c.username
        };

        liveData[c.userId] = {
          userId: c.userId,
          x: c.x ?? 0,
          y: c.y ?? 0,
          targetX: c.x ?? 0,
          targetY: c.y ?? 0
        };
      });

      cursorsRef.current = liveData;
      setStaticCursors(staticData);
    };

    const handleCursorNew = (cursor) => {

      setStaticCursors(prev => ({
        ...prev,
        [cursor.userId]: {
          userId: cursor.userId,
          avatar: cursor.avatarUrl,   // match backend field
          color: cursor.color
        }
      }));

      // 2️⃣ Add to live ref (no render)
      cursorsRef.current[cursor.userId] = {
        userId: cursor.userId,
        x: cursor.x ?? 0,
        y: cursor.y ?? 0,
        targetX: cursor.x ?? 0,
        targetY: cursor.y ?? 0
      };
    };

    const handleCursorMove = ({ userId, x, y }) => {
      const cursor = cursorsRef.current[userId];
      if (!cursor) return;

      cursor.targetX = x;
      cursor.targetY = y;
    };

    const handleCursorLeave = ({ userId }) => {

      // Remove from live ref (no re-render)
      delete cursorsRef.current[userId];

      // Remove from static state (one re-render)
      setStaticCursors(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    };

    const handleMutedList = (list) => {
      setMutedUsers(Array.from(new Set(list)));
    };

    const handleUserMuted = ({ userId }) => {
      setMutedUsers(prev => (
        prev.includes(userId) ? prev : [...prev, userId]
      ));
    };

    const handleUserUnmuted = ({ userId }) => {
      setMutedUsers(prev => prev.filter(id => id !== userId));
      showToast("info", "Unmuted", "User can chat again.");
    };

    const handleMutedWarning = ({ message }) => {
      showToast("warn", "Muted", message);
    };

    const handleClearBoard = () => {
      setBoardData([]);
    };

    socket.on("player-list", handlePlayerList);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-closed", handleRoomClosed);
    socket.on("kicked", handleKicked);
    socket.on("banned", handleKicked);

    socket.on("board-sync", handleBoardSync);
    socket.on("stroke-start", handleStrokeStart);
    socket.on("stroke-update", handleStrokeUpdate);
    socket.on("action-added", handleActionAdded);
    socket.on("action-undo", handleActionUndo);
    socket.on("action-redo", handleActionRedo);
    socket.on("clear-board", handleClearBoard);

    socket.on("room-grace-start", handleGraceStart);
    socket.on("room-grace-cancel", handleGraceCancel);

    socket.on("receive-message", handleReceiveMessage);
    socket.on("spam-warning", handleSpamWarning);

    socket.on("cursor-sync", handleCursorSync);
    socket.on("cursor-new", handleCursorNew);
    socket.on("cursor-move", handleCursorMove);
    socket.on("cursor-leave", handleCursorLeave);

    socket.on("muted-list", handleMutedList);
    socket.on("user-muted", handleUserMuted);
    socket.on("user-unmuted", handleUserUnmuted);
    socket.on("muted-warning", handleMutedWarning);

    return () => {
      socket.off("player-list", handlePlayerList);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("room-closed", handleRoomClosed);
      socket.off("kicked", handleKicked);
      socket.off("banned", handleKicked);

      socket.off("board-sync", handleBoardSync);
      socket.off("stroke-start", handleStrokeStart);
      socket.off("stroke-update", handleStrokeUpdate);
      socket.off("action-added", handleActionAdded);
      socket.off("action-undo", handleActionUndo);
      socket.off("action-redo", handleActionRedo);
      socket.off("clear-board", handleClearBoard);

      socket.off("room-grace-start", handleGraceStart);
      socket.off("room-grace-cancel", handleGraceCancel);

      socket.off("receive-message", handleReceiveMessage);
      socket.off("spam-warning", handleSpamWarning);

      socket.off("cursor-sync", handleCursorSync);
      socket.off("cursor-new", handleCursorNew);
      socket.off("cursor-move", handleCursorMove);
      socket.off("cursor-leave", handleCursorLeave);

      socket.off("muted-list", handleMutedList);
      socket.off("user-muted", handleUserMuted);
      socket.off("user-unmuted", handleUserUnmuted);
      socket.off("muted-warning", handleMutedWarning);
    };
  }, [resetRoomState, showToast]);

  return (
    <RoomContext.Provider
      value={{
        roomCode,
        players,
        admin,

        boardData,
        setBoardData,

        chats,

        staticCursors,
        cursorsRef,
        viewport,
        setViewport,

        joinRoom,
        leaveRoom,
        controlUser,

        isLocked,
        graceEndsAt,

        mutedUsers,

        resetRoomState,
        showToast
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRoom = () => useContext(RoomContext);
