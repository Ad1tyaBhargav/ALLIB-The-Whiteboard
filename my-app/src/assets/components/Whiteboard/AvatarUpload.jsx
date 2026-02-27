import { useRef, useState, useEffect } from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { useRoom } from "../../context/RoomContext";

const url = import.meta.env.VITE_SERVER;

export default function AvatarUpload({ size = 120, onUpload }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const { roomCode } = useRoom()


  const uploadAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(
        `${url}/user/upload-avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: formData
        }
      );

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      return res.json();

    } catch (error) {
      console.error("Avatar upload error:", error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true)
      const data = await uploadAvatar(file);
      setPreview(data.avatar);
      setLoading(false)
    } catch (error) {
      console.error(error);
    }
  };



  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch(`${url}/user/avatar`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await res.json();
      setPreview(data.avatar);
    };

    fetchProfile();
  }, [])

  return (
    <div
      className="position-relative d-inline-block"
      style={{ width: size, height: size }}
    >

      {loading && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background: "#f4f4f4",
            borderRadius: "50%"
          }}
        >
          <i className="pi pi-spin pi-spinner" style={{ fontSize: "1.5rem" }} />
        </div>
      )}

      {/* Avatar */}
      <Avatar
        image={preview}
        icon={!preview ? "pi pi-user" : null}
        shape="circle"
        size="large"
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          fontSize: "2rem"
        }}
      />

      {/* Hidden File Input */}
      <input
        id="avatar"
        type="file"
        accept="image/*"
        name="avatar"
        ref={fileInputRef}
        onChange={handleFileChange}
        hidden
      />

      {/* Upload Button */}
      <Button
        icon={loading ? "pi pi-spin pi-spinner" : "pi pi-camera"}
        className="btn rounded-circle btn-dark d-flex justify-content-center align-items-center "
        style={{
          position: "absolute",
          bottom: 5,
          right: 5,
          width: 36,
          height: 36
        }}
        disabled={loading}
        tooltip={roomCode ? "Leave room to change avatar" : "Change avatar"}
        tooltipOptions={{ position: "top" }}
        onClick={() => fileInputRef.current.click()}
      />
    </div>
  );
}