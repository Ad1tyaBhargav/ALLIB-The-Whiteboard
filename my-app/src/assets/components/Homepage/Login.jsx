import React, { useRef, useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Password } from "primereact/password";
import { Button } from 'primereact/button';
import { Toast } from "primereact/toast";
import axios from "axios";
import { socket } from "../../../socket";

const url = import.meta.env.VITE_SERVER;

export default function Login({ onLogin }) {
    const toast = useRef(null);

    const [user, setUser] = useState({
        username: "",
        password: ""
    });
    const [login, setLogin] = useState(false)
    const [signup, setSignup] = useState(false)
    const [conpass, setConpass] = useState("")

    function handleInput(event) {
        const { name, value } = event.target;
        setUser(prev => ({
            ...prev,
            [name]: value
        }));
    }

    async function handleConfirm() {
        const username = user.username
        const password = user.password

        if (login) {

            const res = await axios.post(
                `${url}/auth/login`, {
                username,
                password
            }, {
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true
            }
            );
            socket.auth = { token: res.data.token };
            socket.connect();
            localStorage.setItem("token", res.data.token)
            onLogin(res.data.username)
            return toast.current.show({ severity: 'success', summary: 'Success', detail: "Successfully Logged In" });
        }
        if (signup) {
            if (username === "") {
                return toast.current.show({ severity: 'error', summary: 'Data Invalid', detail: 'Please enter username' });
            }
            if (password != conpass) {
                return toast.current.show({ severity: 'error', summary: 'Password Invalid', detail: 'Password doesnt match' });
            }

            const res = await axios.post(`${url}/auth/signup`, {
                username,
                password
            }, {
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true
            }
            );

            if (res.data.error) {
                setUser({
                    username: "",
                    password: ""
                })
                return toast.current.show({ severity: 'error', summary: 'Data Invalid', detail: [res.data.error] });
            }

            setLogin(true)
            setSignup(false)
            setUser({
                username: "",
                password: ""
            })
            return toast.current.show({ severity: 'success', summary: 'Success', detail: "New Artist added" });
        }
    }

    return (
        <>
            <div id="welcome-page">
                <h1>Welcome to Allib-The Whiteboard</h1>
                <div className="para">

                </div>

                <div className="inputs">
                    <Toast ref={toast} />
                    {(login || signup) &&
                        <>
                            <InputText id="username" placeholder="Username" value={user.username} name="username" onChange={handleInput} keyfilter="alphanum" className="inputsArea" />
                            <Password inputId="password" placeholder="Password" value={user.password} name="password" onChange={handleInput} className="inputsArea" />
                        </>
                    }
                    {signup &&
                        <Password inputId="confirmPassword" placeholder="Confirm Password" value={conpass} name="confirmPassword" onChange={(e) => setConpass(e.target.value)} className="inputsArea" />
                    }
                </div>
                <div className="welcome-buttons">
                    {(!login && !signup) &&
                        <>
                            <Button className="authBut" label="Login" onClick={() => setLogin(true)} rounded />
                            <Button className="authBut" label="Signup" onClick={() => setSignup(true)} rounded />
                        </>
                    }
                    {(login || signup) &&
                        <>
                            <Button label="Confirm" onClick={handleConfirm} rounded className="authBut" />
                            <Button className="authBut" rounded label="Back" onClick={() => {
                                setLogin(false)
                                setSignup(false)
                                setUser({
                                    username: "",
                                    password: ""
                                })
                            }} />
                        </>
                    }
                </div>
            </div>
        </>
    );
} 