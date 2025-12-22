import BoardMenu from './assets/components/Whiteboard/Boardmenu';
import Chatroom from './assets/components/Whiteboard/ChatRoom';
import AvatarCursor from './assets/components/Whiteboard/cursor';
import Board from './assets/components/Whiteboard/Board';
import GraceCountdown from './assets/components/Whiteboard/GraceCountdown';
import { socket } from './socket';
import { useEffect} from 'react';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useRoom } from './assets/context/RoomContext';


function Whiteboard({ user, logout }) {

  const toast = useRef(null)
  const avatar = "../avatar Sample.webp"
  const {graceEndsAt}=useRoom()

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
      <AvatarCursor avatar={avatar} />
      <BoardMenu username={user} logout={logout} />
      <GraceCountdown endsAt={graceEndsAt}/>
      <Chatroom />
      <Board />
    </>
  );
}

export default Whiteboard;