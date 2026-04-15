import React from "react";

export default function ChatMessage({
    username,
    message,
    avatar,
    isSelf
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: isSelf ? "flex-end" : "flex-start",
                marginBottom: "10px",
                padding: "0 10px"
            }}
        >
            {/* Avatar (left side only if not self) */}
            {!isSelf && (
                <img
                    src={avatar}
                    alt="avatar"
                    style={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginRight: "8px"
                    }}
                />
            )}

            <div
                style={{
                    maxWidth: "min(78%, 320px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isSelf ? "flex-end" : "flex-start"
                }}
            >
                {/* Username */}
                {!isSelf && (
                    <span
                        style={{
                            fontSize: "12px",
                            color: "#888",
                            marginBottom: "3px"
                        }}
                    >
                        {username}
                    </span>
                )}

                {/* Message bubble */}
                <div
                    style={{
                        background: isSelf ? "#3797F0" : "#efefef",
                        color: isSelf ? "#fff" : "#000",
                        padding: "8px 12px",
                        borderRadius: "18px",
                        fontSize: "14px",
                        wordBreak: "break-word"
                    }}
                >
                    {message}
                </div>
            </div>

            {/* Avatar (right side if self) */}
            {isSelf && (
                <img
                    src={avatar}
                    alt="avatar"
                    style={{
                        width: "35px",
                        height: "35px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginLeft: "8px"
                    }}
                />
            )}
        </div>
    );
}
