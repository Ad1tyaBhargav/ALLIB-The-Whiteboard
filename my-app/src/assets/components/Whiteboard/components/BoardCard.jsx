import { Button } from "primereact/button"
import { useRoom } from "../../../context/RoomContext";

export default function BoardCard({ room, deleteRoom }) {

    const { joinRoom } = useRoom()

    return (
        <div className="board-card" >

            <div
                className="preview-wrapper"
                onClick={() => {
                    joinRoom(room.roomCode);
                    close();
                }}
            >
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

            <button
                className="btn btn-outline-danger outline RoomDeleteButton "
                onClick={(e) => {
                    e.stopPropagation(); // ❗ prevent join
                    deleteRoom(room.roomCode);
                }}
            >
                🗑️
            </button>
        </div>
    )
}