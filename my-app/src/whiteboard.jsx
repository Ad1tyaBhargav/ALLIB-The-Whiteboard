import BoardMenu from './assets/components/Whiteboard/Boardmenu';
import Chatroom from './assets/components/Whiteboard/ChatRoom';
import AvatarCursor from './assets/components/Whiteboard/components/AvatarCursor';
import Board from './assets/components/Whiteboard/Board';
import GraceCountdown from './assets/components/Whiteboard/GraceCountdown';
import { socket } from './socket';
import { useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useRoom } from './assets/context/RoomContext';


function Whiteboard({ user, logout }) {

  const toast = useRef(null)
  const viewportRef = useRef({ scale: 1, x: 0, y: 0 });
  const { graceEndsAt, staticCursors, viewport, cursorsRef } = useRoom()

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

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
          const currentViewport = viewportRef.current;
          el.style.transform = `translate(${cursor.x * currentViewport.scale + currentViewport.x}px, ${cursor.y * currentViewport.scale + currentViewport.y}px)`;
        }
      });

      frame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frame);
  }, [cursorsRef]);

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
            zIndex: 9998
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
      <Chatroom user={user}/>
      <Board user={user} />
    </>
  );
}

export default Whiteboard;
