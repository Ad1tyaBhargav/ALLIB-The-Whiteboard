import axios from "axios";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/soho-dark/theme.css";
import { useEffect, useState,useRef } from "react";
import { RoomProvider } from "./assets/context/RoomContext";
import Homepage from "./Homepage";
import { socket } from "./socket";
import Whiteboard from "./whiteboard";
import { Toast } from "primereact/toast";

const url = import.meta.env.VITE_SERVER;

function App() {

  const toastRef = useRef(null);

  const [auth, setAuth] = useState({
    loading: false,   //initial state true
    loggedIn: true,   //initial state false
    user: "Norse"        //initial state null
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    verifyToken();
  }, []);

  function handleAuth(user) {
    setAuth({
      loading: false,
      loggedIn: true,
      user
    });
  }

  const verifyToken = async () => {

    if (!token) {
      setAuth({
        loading: false,
        loggedIn: false,
        user: null
      });
      return;
    }

    try {
      const res = await axios.get(`${url}/auth/verify`, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      setAuth({
        loading: false,
        loggedIn: true,
        user: res.data.user
      });
      socket.auth = { token };
      socket.connect();

    } catch (err) {
      localStorage.removeItem("token");
      setAuth({ loading: false, loggedIn: false, user: null });
    }
  };

  if (auth.loading) return <h2>Loading...</h2>;

  function logout() {
    localStorage.removeItem("token");
    socket.disconnect();
    setAuth({
      loading: false,
      loggedIn: false,
      user: null
    });
  }

  return (
    <>
      <Toast ref={toastRef} position="top-right" />
      {auth.loggedIn
        ?
        <RoomProvider toastRef={toastRef}>
          <Whiteboard user={auth.user.id} logout={logout} />
        </RoomProvider>
        :
        <Homepage onLogin={handleAuth} />}

    </>
  );
}

export default App
