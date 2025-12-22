import { SpeedDial } from "primereact/speeddial";
import BoardList from "./BoardList";
import "primereact/resources/themes/soho-dark/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { useState } from "react";
import RoomUsers from "./RoomUsers";
import { socket } from "../../../socket";
import { useRoom } from "../../context/RoomContext";

export default function BoardMenu({username,logout}) {

    const [showList, setShowList]=useState(false)
    const [showRoom,setShowRoom]=useState(false)

    const {leaveRoom,roomCode}=useRoom();

    function closeList(){
        setShowList(false)
        setShowRoom(false)
    }

    const items = [
        {
            label: 'Add',
            icon: 'pi pi-sign-out',
            className:"custom-action",
            command: () => {
                roomCode?leaveRoom():logout();
            }
        },
        {
            label: 'Update',
            icon: 'pi pi-users',
            className:"custom-action",
            command: () => {
                setShowRoom(true)
            }
        },
        {
            label: 'Boards',
            icon: 'pi pi-clipboard',
            className:"custom-action",
            command: () => {
                setShowList(true)
            }
        }
    ];

    return (
        <>
            <SpeedDial model={items} radius={120} type="quarter-circle" direction="down-right" style={{ top:20,left:20 }}  className="custom-speeddial" />
            {showList && <BoardList close={closeList} username={username}/>}
            {showRoom && <RoomUsers close={closeList} />}
        </>
    );

}
