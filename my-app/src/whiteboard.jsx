import BoardMenu from './assets/components/Whiteboard/Boardmenu';
import Chatroom from './assets/components/Whiteboard/ChatRoom';
import AvatarCursor from './assets/components/Whiteboard/cursor';
import Board from './assets/components/Whiteboard/Board';
import GraceCountdown from './assets/components/Whiteboard/GraceCountdown';
import { socket } from './socket';
import { useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useRoom } from './assets/context/RoomContext';


function Whiteboard({ user, logout }) {

  const toast = useRef(null)
  const avatar = "../avatar Sample.webp"
  const { graceEndsAt, cursors,viewport } = useRoom()

  useEffect(() => {
    const handleErrorMessage = (msg) => {
      console.log(msg)
    };

    socket.on("error-message", handleErrorMessage);

    return () => {
      socket.off("error-message", handleErrorMessage);
    };
  }, []);

  return (
    <>
      <Toast ref={toast} />
      {Object.entries(cursors).map(([id, cursor]) => (
        <AvatarCursor
          key={id}
          x={cursor.x}
          y={cursor.y}
          avatar={avatar}
          viewport={viewport}
        />
      ))}
      <BoardMenu logout={logout} userId={user} />
      <GraceCountdown endsAt={graceEndsAt} />
      <Chatroom />
      <Board user={user} />
    </>
  );
}

export default Whiteboard;