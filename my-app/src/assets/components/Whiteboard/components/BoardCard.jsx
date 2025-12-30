import { Button } from "primereact/button"
import { useRoom } from "../../../context/RoomContext";

export default function BoardCard({ room, deleteRoom }) {

    const { joinRoom } = useRoom()

    return (
        <div className="board-card" key={room._id}>

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

            <Button
                className="RoomDeleteButton"
                icon="pi pi-trash"
                onClick={(e) => {
                    e.stopPropagation(); // ❗ prevent join
                    deleteRoom(room.roomCode);
                }}
            />
        </div>
    )
}