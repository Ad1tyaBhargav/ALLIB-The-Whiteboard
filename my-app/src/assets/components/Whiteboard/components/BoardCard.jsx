import ConfirmScreen from "./ConfirmScreen";
import { useRoom } from "../../../context/RoomContext";

export default function BoardCard({ room, deleteRoom }) {

    const { joinRoom } = useRoom()

    return (
        <div className="board-card" onClick={() => {
            joinRoom(room.roomCode, false);
            close();
        }}>

            <div className="preview-wrapper">
                <img
                    src={room.previewImage || "/placeholder.png"}
                    alt="Board Preview"
                    className="preview-img"
                    onError={(e) => {
                        e.target.src = "/placeholder.png";
                    }}
                />

                <div className="board-code">
                    {room.roomCode}
                </div>
            </div>

            <div className="RoomDeleteButton">

                <ConfirmScreen
                    lable={"🗑️"}
                    header={"DELETING ROOM"}
                    message={<>
                        Are sure you want to room: {room.roomCode}? <br />
                        Drawing will also be deleted.<br />
                        TIP: Best is to first  export Whiteboard as image.
                    </>}
                    onConfirm={() => deleteRoom(room.roomCode)}
                />
            </div>
        </div>
    )
}