import "primereact/resources/themes/soho-dark/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { useRoom } from "../../context/RoomContext";
import PlayerCard from "./components/PlayerCard";

const url = import.meta.env.VITE_SERVER;

export default function RoomUsers({ close }) {

    const { roomCode,players } = useRoom()

    return (
        <>
            <div className="BoardList">

                <div className="BoardListCloseButton">
                    <h2>Room Menu</h2>
                    <Button icon="pi pi-times" onClick={close} />
                </div>
                <div className="roomCodeSty">
                    {roomCode ? <h1>CODE-{roomCode}</h1> : <h1>Your room code will appear here</h1>}
                </div>
                <div className="player-list">
                    {players.map((player) => (
                        <PlayerCard
                            player={player}
                        />
                       ))}
                </div>
            </div>
        </>
    )
}