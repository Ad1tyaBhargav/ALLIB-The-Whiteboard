import React, { useEffect, useState } from "react";

export default function AvatarCursor({ avatar, color }) {

    const border=`4px solid ${color}`

    return (
        <>
            {/* Custom avatar cursor */}
            <div
                style={{
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                }}
            >
                {/* Avatar Circle */}
                <div id="avatar-circle" >

                    <img
                        src={avatar}
                        alt="avatar"
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border,
                            objectFit: "cover"
                        }}
                    />

                    {/* Little arrow triangle (pointer) */}
                    <div style={{
                        position:"relative",
                        bottom:14,
                        left:10,
                        backgroundColor: color,
                    }} />
                </div>
            </div>
        </>
    );
}
