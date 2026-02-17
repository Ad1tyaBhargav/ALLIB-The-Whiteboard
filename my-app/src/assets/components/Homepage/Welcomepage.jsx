import React from 'react'
import Login from './Login'

export default function Welcomepage({onLogin}) {
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
                        <div className="d-flex justify-content-between align-items-center">
                            <h3 className="mb-0">Whiteboard</h3>

                            <nav className="nav">
                                <a className="nav-link text-white fw-bold" href="#">Home</a>
                                <a className="nav-link text-white fw-bold" href="#">Features</a>
                                <a className="nav-link text-white fw-bold" href="#">Contact</a>
                            </nav>
                        </div>
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