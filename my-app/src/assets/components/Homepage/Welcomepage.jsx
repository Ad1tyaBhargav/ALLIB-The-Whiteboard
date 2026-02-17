import React from 'react'
import Login from './Login'

export default function Welcomepage({ onLogin }) {
    return (
        <>
            <div className="position-relative min-vh-100 text-white container-fluid">

                {/* Background Image */}
                <img
                    src="/Imgs/WBimg6.png"
                    alt=""
                    className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
                    style={{ zIndex: 0 }}
                />

                {/* Overlay */}
                <div
                    className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex flex-column justify-content-between p-4"
                    style={{ zIndex: 1 }}
                >

                    <header>
                        <nav className="navbar navbar-expand-md navbar-dark">
                            <div className="container-fluid">

                                <a className="navbar-brand fw-bold" href="#">
                                    Whiteboard
                                </a>

                                <button
                                    className="navbar-toggler"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#navbarContent"
                                >
                                    <span className="navbar-toggler-icon"></span>
                                </button>

                                <div className="collapse navbar-collapse" id="navbarContent">
                                    <ul className="navbar-nav ms-auto mb-2 mb-md-0">
                                        <li className="nav-item">
                                            <a className="nav-link fw-bold" href="#">Home</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link fw-bold" href="#">Features</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className="nav-link fw-bold" href="#">Contact</a>
                                        </li>
                                    </ul>
                                </div>

                            </div>
                        </nav>
                    </header>


                    <main className="text-center">
                        <h1>Collaborate in Real-Time</h1>
                        <p className="lead">
                            Draw, chat and collaborate live with up to 4 users inside secure admin-controlled rooms.
                        </p>
                        <Login onLogin={onLogin} />
                    </main>

                    <footer className="text-center small">
                        Built with MERN + Socket.io
                    </footer>

                </div>
            </div>

        </>
    )
}