import { Button } from "primereact/button"
import { socket } from "../../../../socket"
import { useRoom } from "../../../context/RoomContext"

export default function PlayerCard({ player, isAdmin, admin, userId }) {

    const { roomCode } = useRoom()

    return (
        <div key={player.id} className="player-item" id={player.userId}>
            <span className="player-name">
                {player.username}
            </span>
            {player.isAdmin && (
                <span className="admin-badge font-xl ml-2">
                    <div className="fs-2">👑</div>
                </span>
            )}

            {/* 🔴 Kick / Ban - visible ONLY to admin, and not on self */}
            {userId === admin && !(player.isAdmin) && (
                <div className="d-flex gap-3">
                    <button
                        className="btn btn-warning p-2 fs-3 rounded-circle"
                        onClick={() =>
                            socket.emit("kick-user", {
                                roomCode,
                                targetUserId: player.userId,
                            })
                        }
                    >🦶
                    </button>

                    <button

                        className="btn btn-danger p-2 fs-3 rounded-circle"
                        onClick={() =>
                            socket.emit("ban-user", {
                                roomCode,
                                targetUserId: player.userId,
                            })
                        }
                    >
                        🚫
                    </button>
                </div>
            )}
        </div>
    )
}



//keep editng  kick and ban buttons, only show to admin and not on self