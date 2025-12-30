import { Button } from "primereact/button"

export default function PlayerCard({player}){

    return (
        <div key={player.id} className="player-item" id={player.userId}>
            <span className="player-name">
                {player.username}
            </span>
            {player.isAdmin && (
                <>
                    <span className="admin-badge"><i className="pi pi-crown" style={{ fontSize: '1.5rem' }}></i></span>
                    <div className="player-buttons">
                        <Button icon="pi pi-sign-out" severity="danger" rounded />
                        <Button icon="pi pi-ban" severity="danger" rounded />
                    </div>
                </>
            )}
        </div>
    )
}