import "primereact/resources/themes/soho-dark/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import axios from "axios";
import BoardCard from "./components/BoardCard";
import { InputText } from 'primereact/inputtext';
import { useRoom } from "../../context/RoomContext";
import { Toast } from 'primereact/toast';

const url = import.meta.env.VITE_SERVER;

export default function BoardList({ close, username }) {

    const toast = useRef(null)
    const [rooms, setRooms] = useState([])
    const [Input, setInput] = useState("")
    const [showInput, setShowInput] = useState(false)
    const [loading, setLoading] = useState(true);
    const { joinRoom } = useRoom()
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await axios.get(`${url}/room/fetch-rooms`, {
                headers: {
                    Authorization: "Bearer " + token
                }
            });
            setRooms(res.data.UserRooms);
        } catch (err) {
            console.log(err)
            console.log("Fetch rooms failed", err);
        } finally {
            setLoading(false);
        }
    };

    async function newRoom() {
        try {

            const res = await axios.post(
                `${url}/room/create-room`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const { roomCode } = res.data;
            joinRoom(roomCode)
            close();
        } catch (err) {
            console.log(err)
        }
    }

    async function deleteRoom(roomCode) {

        try {
            await axios.delete(`${url}/room/delete-room/${roomCode}`, {
                headers: {
                    Authorization: "Bearer " + token
                }
            });
            fetchRooms()

            toast.current?.show({
                severity: "secondary",
                summary: "Room Deleted",
                detail: `${roomCode} deleted `,
                life: 3000
            });
        } catch (err) {
            console.log(err)
            toast.current?.show({
                severity: "danger",
                summary: "Room Delete error",
                detail: err.response?.data?.error || "Failed to delete room",
                life: 3000
            });
        }
    }

    function handleInput(event) {
        let { value } = event.target;
        value = value.toUpperCase();
        setInput(value);

        if (value.length === 6) {
            joinRoom(value);
            close();
        }
    }

    return (
        <>
            <Toast ref={toast} />
            <div className="BoardList">
                <div className="BoardListCloseButton ">
                    <h2>Board Menu</h2>
                    <Button icon="pi pi-times" className="rounded" onClick={close} />
                </div>

                {loading && <p>Loading boards...</p>}

                <div className="rooms-container">
                    {rooms.length === 0 ? (
                        <></>
                    ) : (
                        rooms.map((room) => (
                            <BoardCard
                                key={room._id}
                                room={room}
                                deleteRoom={deleteRoom}
                            />
                        ))
                    )}
                    <Card className="RoomButtons" onClick={newRoom} >
                        New Room
                    </Card>
                    <Card className="RoomButtons  " onClick={() => setShowInput(true)}>
                        {showInput ? <InputText value={Input} onChange={handleInput} name="roomcode" className="codeInput" keyfilter="alphanum" placeholder="Room Code" /> : <> Join Room</>}
                    </Card>

                </div>

            </div >
        </>
    )
}