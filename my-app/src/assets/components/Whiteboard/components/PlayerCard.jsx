import { Avatar } from 'primereact/avatar';
import { useRoom } from "../../../context/RoomContext"
import ConfirmScreen from './ConfirmScreen';

export default function PlayerCard({ player, admin, userId }) {

    const { roomCode, controlUser, mutedUsers } = useRoom()

    return (
        <div key={player.id} className="player-item" id={player.userId}>
            <div className='d-flex justify-content-center align-items-center gap-4 '>
                <Avatar image={player.avatarUrl} size="xlarge" shape="circle" />

                <span className='text-center' >
                    {player.username}
                </span>
            </div>
            {player.isAdmin && (
                <span className="admin-badge font-xl ml-2">
                    <div className="fs-2">👑</div>
                </span>
            )}

            {/* 🔴 Kick / Ban - visible ONLY to admin, and not on self */}
            {userId === admin && !(player.isAdmin) && (
                <div className="d-flex gap-3">
                    <ConfirmScreen
                        lable={"🦶"}
                        header={"KICKING"}
                        message={<>
                            Are you sure you want to kick {player.username}?
                        </>}
                        onConfirm={() => controlUser("kick-user", roomCode, player.userId)}
                    />

                    <ConfirmScreen
                        lable={"🚫"}
                        header={"BANNING"}
                        message={<>
                            Are you sure you want to ban {player.username}? <br />
                            Will never be able to join again.
                        </>}
                        onConfirm={() => controlUser("ban-user", roomCode, player.userId)}
                    />

                    <ConfirmScreen
                        lable={mutedUsers.includes(player.userId) ? "🔇" : "🔊"}
                        header={"BANNING"}
                        message={mutedUsers.includes(player.userId) ?
                            <>
                                Are you sure you want to unmute {player.username}? <br />
                                Will able to chat now.
                            </> :
                            <>
                                Are you sure you want to mute {player.username}? <br />
                                Will not able to chat.
                            </>
                        }
                        onConfirm={() => controlUser("toggle-mute", roomCode, player.userId)}
                    />
                </div>
            )}
        </div>
    )
}



//keep editng  kick and ban buttons, only show to admin and not on self