import React, { useRef, useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { Password } from "primereact/password";
import { Button } from 'primereact/button';
import { Toast } from "primereact/toast";
import axios from "axios";
import { socket } from "../../../socket";
import { Dialog } from 'primereact/dialog';


const url = import.meta.env.VITE_SERVER;

export default function Login({ onLogin }) {
    const toast = useRef(null);

    const [user, setUser] = useState({
        username: "",
        password: ""
    });
    const [login, setLogin] = useState(false)
    const [signup, setSignup] = useState(true)
    const [conpass, setConpass] = useState("")
    const [visible, setVisible] = useState(false);

    function handleInput(event) {
        const { name, value } = event.target;
        setUser(prev => ({
            ...prev,
            [name]: value
        }));
    }

    async function handleConfirm() {
        if(window.innerWidth < 768) {   
            toast.current.show({
                severity: "warn",
                summary: "Screen Too Small",
                detail: "For better experience, please use a device with a larger screen.",
            });
            return; 
        }

        const username = user.username
        const password = user.password

        if (login) {
            try {
                const res = await axios.post(
                    `${url}/auth/login`,
                    {
                        username,
                        password,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                        withCredentials: true,
                    }
                );

                socket.auth = { token: res.data.token };
                socket.connect();

                localStorage.setItem("token", res.data.token);

                onLogin(res.data.username);

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Successfully Logged In",
                });

            } catch (error) {
                console.error("Login error:", error);

                const message =
                    error.response?.data?.message ||
                    "Login failed. Please try again.";

                toast.current.show({
                    severity: "error",
                    summary: "Login Failed",
                    detail: message,
                });
            }
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
            <Toast ref={toast} />
            <Button label="Login" icon="pi pi-user" onClick={() => setVisible(true)} className="btn btn-lg btn-light text-black" />
            <Dialog
                visible={visible}
                modal
                onHide={() => { if (!visible) return; setVisible(false); }}
                content={({ hide }) => (
                    <div className="flex p-4 align-items-center bg-dark rounded">

                        <ul className="nav flex justify-content-center mb-3">
                            <li className="nav-item">
                                <a className={`nav-link text-white fw-bold ${login ? "border-bottom border-white" : ""}`} href="#" onClick={() => { setLogin(true); setSignup(false) }}>
                                    Login
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link text-white fw-bold ${signup ? "border-bottom border-white" : ""}`} href="#" onClick={() => { setSignup(true); setLogin(false) }}>
                                    Sign-Up
                                </a>
                            </li>
                        </ul>

                        <div className="input-group mb-3">
                            <InputText id="username" placeholder="Username" value={user.username} name="username" onChange={handleInput} keyfilter="alphanum" className="form-control" />
                        </div>

                        <div className="input-group mb-3">
                            <Password inputId="password" placeholder="Password" value={user.password} name="password" onChange={handleInput} feedback={false} toggleMask />
                        </div>

                        {signup && (
                            <div className="input-group mb-3">
                                <Password inputId="conpass" placeholder="Confirm Password" value={conpass} name="conpass" onChange={(e) => setConpass(e.target.value)} feedback={false} toggleMask />
                            </div>
                        )}

                        <div className="d-flex justify-content-center gap-4 mt-4">
                            <Button label={login ? "Login" : "Sign-Up"} onClick={handleConfirm} text className="btn btn-primary"></Button>
                            <Button label="Cancel" onClick={(e) => hide(e)} text className="btn btn-primary"></Button>
                        </div>
                    </div>
                )}
            ></Dialog>
        </>
    );
} 