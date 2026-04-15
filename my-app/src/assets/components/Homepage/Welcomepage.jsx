import React from "react";
import Login from "./Login";

export default function Welcomepage({ onLogin }) {
  return (
    <div className="relative text-white" style={{ minHeight: "100dvh" }}>

      {/* Background Image */}
      <img
        src="/Imgs/WBimg6.png"
        alt="bg"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-between px-4 py-4 md:px-6" style={{ minHeight: "100dvh" }}>

        {/* Header */}
        <header className="flex flex-wrap items-center justify-center gap-4 md:justify-between">
          <div className="flex items-center gap-2">
            <img src="/Imgs/allibLogo.png" alt="logo" className="h-6" />
          </div>

          <nav className="hidden md:flex gap-8 font-semibold text-sm">
            <a href="https://aditya-dev-six.vercel.app/" className="hover:text-gray-300 transition">Credit</a>
            <a href="#" className="hover:text-gray-300 transition">Features</a>
            <a href="#" className="hover:text-gray-300 transition">Contact</a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center text-center max-w-2xl mx-auto w-full py-8 md:py-12">

          <img
            src="/Imgs/allibLogo.png"
            alt="logo"
            className="w-40 max-w-full mb-6 md:w-52"
          />

          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Collaborate in Real-Time
          </h1>

          <p className="text-gray-300 text-base md:text-lg mb-8 px-2">
            Draw, chat, and collaborate live with up to 4 users inside secure,
            admin-controlled rooms.
          </p>

          <Login onLogin={onLogin} />

        </main>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-400">
          Built with love ❤️
        </footer>
      </div>
    </div>
  );
}
