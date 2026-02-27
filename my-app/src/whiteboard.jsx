import BoardMenu from './assets/components/Whiteboard/Boardmenu';
import Chatroom from './assets/components/Whiteboard/ChatRoom';
import AvatarCursor from './assets/components/Whiteboard/AvatarCursor';
import Board from './assets/components/Whiteboard/Board';
import GraceCountdown from './assets/components/Whiteboard/GraceCountdown';
import { socket } from './socket';
import { useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { useRef, useMemo } from 'react';
import { useRoom } from './assets/context/RoomContext';


function Whiteboard({ user, logout }) {

  const toast = useRef(null)
  const { graceEndsAt, staticCursors, viewport, cursorsRef } = useRoom()

  useEffect(() => {
    const handleErrorMessage = (msg) => {
      console.log(msg)
    };

    socket.on("error-message", handleErrorMessage);

    return () => {
      socket.off("error-message", handleErrorMessage);
    };
  }, []);

  useEffect(() => {
    let frame;

    const lerp = (start, end, factor) =>
      start + (end - start) * factor;

    const animate = () => {
      Object.values(cursorsRef.current).forEach(cursor => {
        cursor.x = lerp(cursor.x, cursor.targetX, 0.2);
        cursor.y = lerp(cursor.y, cursor.targetY, 0.2);

        const el = document.getElementById(`cursor-${cursor.userId}`);
        if (el) {
          el.style.transform = `translate(${cursor.x * viewport.scale + viewport.x}px, ${cursor.y * viewport.scale + viewport.y}px)`;
        }
      });

      frame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <Toast ref={toast} />
      {Object.entries(staticCursors).map(([userId, cursor]) => (
        <div
          key={userId}
          id={`cursor-${userId}`}
          style={{
            position: "absolute",
            transform: "translate(0px, 0px)",
            pointerEvents: "none",
            willChange: "transform",
            zIndex: 9999
          }}
        >
          <AvatarCursor
            avatar={cursor.avatar}
            color={cursor.color}
          />
        </div>
      ))}
      <BoardMenu logout={logout} userId={user} />
      <GraceCountdown endsAt={graceEndsAt} />
      <Chatroom />
      <Board user={user} />
    </>
  );
}

export default Whiteboard;