import React, { useEffect, useState } from "react";

export default function AvatarCursor({ avatar, x, y,viewport }) {
    if (x == null || y == null) return null;

    const screenX = x * viewport.scale + viewport.x;
    const screenY = y * viewport.scale + viewport.y;

    return (
        <>
            {/* Custom avatar cursor */}
            <div
                style={{
                    position: "fixed",
                    top: screenY,
                    left: screenX,
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
                    <div />
                </div>
            </div>
        </>
    );
}
