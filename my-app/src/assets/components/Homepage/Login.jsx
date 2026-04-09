import React, { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import axios from "axios";
import { socket } from "../../../socket";
import { useGoogleLogin } from "@react-oauth/google";

const url = import.meta.env.VITE_SERVER;

export default function Login({ onLogin }) {
    const toast = useRef(null);

    const [visible, setVisible] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const [user, setUser] = useState({
        username: "",
        password: "",
        email: "",
    });

    const [conpass, setConpass] = useState("");

    const handleInput = (e) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const { username, password, email } = user;

        if (!username || !password||(!isLogin && !email)) {
            return toast.current.show({
                severity: "warn",
                summary: "Missing Fields",
                detail: "Fill all fields",
            });
        }

        try {
            if (isLogin) {
                const res = await axios.post(`${url}/auth/login`, {
                    username,
                    password,
                });

                socket.auth = { token: res.data.token };
                socket.connect();

                localStorage.setItem("token", res.data.token);
                onLogin(res.data.username);

                toast.current.show({
                    severity: "success",
                    summary: "Welcome back 🚀",
                });

                setVisible(false);
            } else {
                if (password !== conpass) {
                    return toast.current.show({
                        severity: "error",
                        summary: "Password mismatch",
                    });
                }

                const res = await axios.post(`${url}/auth/signup`, {
                    email,
                    username,
                    password,
                });

                if (res.data.error) {
                    return toast.current.show({
                        severity: "error",
                        summary: res.data.error,
                    });
                }

                toast.current.show({
                    severity: "success",
                    summary: "Account created 🎉",
                });

                setIsLogin(true);
                setUser({ username: "", password: "" });
                setConpass("");
            }
        } catch (err) {
            console.log(err);
            toast.current.show({
                severity: "error",
                summary: "Something went wrong",
                message: err.message,
            });
        }
    };

    async function handleGoogle(userInfo) {

        const response = await axios.post(`${url}/auth/google`, {
            email: userInfo.email,
            username: userInfo.name,
            avatar: userInfo.picture,
            googleId: userInfo.sub,
        });

        socket.auth = { token: response.data.token };
        socket.connect();

        localStorage.setItem("token", response.data.token);
        onLogin(response.data.username);
    }

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log("Access Token:", tokenResponse.access_token);

            // 🔥 get user info from google
            const userInfo = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                }
            ).then((res) => res.json());

            console.log("User Info:", userInfo);
            handleGoogle(userInfo)

        },
        onError: () => {
            console.log("Login Failed");
        },
    });

    return (
        <>
            <Toast ref={toast} />

            {/* Trigger */}
            <button
                onClick={() => setVisible(true)}
                className="px-6 py-2 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition"
            >
                Get Started
            </button>

            {/* Modal */}
            <Dialog
                visible={visible}
                onHide={() => setVisible(false)}
                modal
                className="w-full max-w-md"
                contentClassName="p-0 bg-transparent"
                showHeader={false}
            >
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white shadow-2xl">

                    {/* Close Button */}
                    <button
                        onClick={() => setVisible(false)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-white text-lg"
                    >
                        ✕
                    </button>

                    {/* Tabs */}
                    <div className="flex justify-center mb-6 mt-2">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`px-4 py-2 text-sm font-semibold ${isLogin ? "border-b-2 border-white" : "text-gray-400"
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`px-4 py-2 text-sm font-semibold ${!isLogin ? "border-b-2 border-white" : "text-gray-400"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">

                        {/* Username */}
                        <InputText
                            name="username"
                            value={user.username}
                            onChange={handleInput}
                            placeholder="Username"
                            className="w-full h-11 !bg-white/10 !text-white border border-white/20 rounded-lg px-4"
                        />

                        {/* Email (only for signup) */}
                        {!isLogin && (
                            <InputText
                                name="email"
                                value={user.email}
                                onChange={handleInput}
                                placeholder="Email"
                                className="w-full h-11 !bg-white/10 !text-white border border-white/20 rounded-lg px-4"
                            />
                        )}

                        {/* Password */}
                        <Password
                            name="password"
                            value={user.password}
                            onChange={handleInput}
                            placeholder="Password"
                            feedback={false}
                            toggleMask
                            className="w-full"
                            inputClassName="!w-full !h-11 !bg-white/10 !text-white border border-white/20 rounded-lg px-4"
                            panelClassName="!w-full !h-11 !bg-white/10 !text-white border border-white/20 rounded-lg px-4"
                        />

                        {/* Confirm Password */}
                        {!isLogin && (
                            <Password
                                value={conpass}
                                onChange={(e) => setConpass(e.target.value)}
                                placeholder="Confirm Password"
                                feedback={false}
                                toggleMask
                                className="w-full"
                                inputClassName="w-full h-11 !bg-white/10 !text-white border border-white/20 rounded-lg px-4"
                            />
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            className="w-full h-11 rounded-lg font-semibold 
      bg-gradient-to-r from-white to-gray-300 text-black
      hover:from-gray-200 hover:to-white
      transition-all duration-200 shadow-md"
                        >
                            {isLogin ? "Login" : "Create Account"}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-white/20"></div>
                            <span className="text-xs text-gray-400">OR</span>
                            <div className="flex-1 h-px bg-white/20"></div>
                        </div>

                        {/* Custom Google Button */}
                        <button
                            className="w-full h-11 flex items-center justify-center gap-3 
      bg-white text-black rounded-lg font-medium 
      hover:bg-gray-100 transition shadow-sm"
                            onClick={loginWithGoogle}
                        >
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="google"
                                className="w-5 h-5"
                            />
                            Continue with Google
                        </button>
                        <footer className="text-center text-xs text-gray-400 mt-4">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-blue-500 hover:underline"
                            >
                                {isLogin ? "Sign up" : "Log in"}
                            </button>
                        </footer>
                    </div>
                </div>
            </Dialog>
        </>
    );
}