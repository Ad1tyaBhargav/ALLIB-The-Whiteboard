import React, { useEffect, useState } from "react";

export default function AvatarCursor({avatar}) {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    

    useEffect(() => {
        const move = (e) => {
            setPos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    return (
        <>
            {/* Hide system cursor */}
            <style>{`body { cursor: none; }
            body, html, * { cursor: none !important;}`}</style>

            {/* Custom avatar cursor */}
            <div
                style={{
                    position: "fixed",
                    top: pos.y,
                    left: pos.x,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    zIndex: 9999,
                }}
            >
                {/* Avatar Circle */}
                <div id="avatar-circle" >

                    <img
                        src={avatar}
                        alt="avatar"
                        style={{
                            border: "5px solid blue",  //custom and  random colors
                        }}
                    />

                    {/* Little arrow triangle (pointer) */}
                    <div/>
                </div>
            </div>
        </>
    );
}
