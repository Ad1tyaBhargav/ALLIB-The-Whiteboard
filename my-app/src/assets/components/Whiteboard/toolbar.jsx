import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { ColorPicker } from "primereact/colorpicker";
import { Slider } from "primereact/slider";

export default function Toolbar({
  onPenChange,
  onToolChange,
  clearCanvas,
  isAdmin,
  stageRef,
}) {
  const [position, setPosition] = useState({ x: 500, y: 500 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [penOpen, setPenOpen] = useState(false);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [activeTool, setActiveTool] = useState("pen");

  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [fillEnabled, setFillEnabled] = useState(false);

  /* ================= Drag ================= */

  const handleMouseDown = (e) => {
    const isButton = e.target.closest(".p-button");
    const isMenu = e.target.closest(".popup-menu");
    if (isButton || isMenu) return;

    setDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  /* ================= Sync ================= */

  useEffect(() => {
    onPenChange?.({ color, size, fillEnabled });
  }, [color, size, fillEnabled]);

  const activateTool = (tool) => {
    setActiveTool(tool);
    onToolChange(tool);
  };

  /* ================= Export ================= */

  const exportBoard = () => {
    if (!stageRef?.current) return;

    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });

    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = uri;
    link.click();
  };

  /* ================= Render ================= */

  return (
    <div
      id="toolbar"
      className="position-absolute bg-dark rounded-lg shadow d-flex gap-2 align-items-center"
      style={{
        top: position.y,
        left: position.x,
        zIndex: 9999,
        cursor: dragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Pen */}
      <Button
        icon="pi pi-pencil"
        className={`${activeTool === "pen" ? "active-tool" : ""} rounded-circle`}
        onClick={() => {
          setPenOpen((prev) => !prev);
          setShapeOpen(false);
          activateTool("pen");
        }}
      />

      {/* Shape */}
      <Button
        icon="pi pi-stop"
        className={`${activeTool !== "pen" && activeTool !== "eraser" ? "active-tool" : ""} rounded-circle`}
        onClick={() => {
          setShapeOpen((prev) => !prev);
          setPenOpen(false);
        }}
      />

      {/* Eraser */}
      <Button
        icon="pi pi-eraser"
        className={`${activeTool === "eraser" ? "active-tool" : ""} rounded-circle`}
        onClick={() => activateTool("eraser")}
      />

      {/* Fill Toggle */}
      <Button
        icon="pi pi-palette"
        severity={fillEnabled ? "success" : "secondary"}
        className={`${fillEnabled && "active-tool"} rounded-circle`}
        onClick={() => setFillEnabled((prev) => !prev)}
        tooltip="Toggle Fill"
      />

      {/* Export */}
      <Button
        icon="pi pi-download"
        severity="info"
        className="rounded-circle"
        onClick={exportBoard}
        tooltip="Export Image"
      />

      {/* Clear (Admin Only) */}
      <Button
        icon="pi pi-trash"
        severity="danger"
        className="rounded-circle"
        disabled={!isAdmin}
        onClick={() => {
          if (isAdmin) clearCanvas();
        }}
        tooltip="Clear Canvas (Admin Only)"
      />

      {/* Pen Popup */}
      {penOpen && (
        <div className="popup-menu p-3 d-flex flex-column gap-2">
          <div className="pen-setting-group">
            <label>Color</label>
            <ColorPicker
              value={color.replace("#", "")}
              onChange={(e) => setColor("#" + e.value)}
            />
          </div>

          <div className="pen-setting-group">
            <label>Size: {size}</label>
            <Slider
              value={size}
              onChange={(e) => setSize(e.value)}
              min={1}
              max={30}
              style={{ width: "120px" }}
            />
          </div>
        </div>
      )}

      {/* Shape Popup */}
      {shapeOpen && (
        <div className="popup-menu d-flex gap-2">
          {[{ name: "line", icon: "---" }, { name: "rectangle", icon: "🔲" }, { name: "circle", icon: "⚪" }, { name: "arrow", icon: "➡️" }].map((shape) => (
            <div
              key={shape.name}
              className={`btn btn-light   ${activeTool === (shape.name) ? "shape-active" : ""
                }`}
              onClick={() => activateTool(shape.name)}
            >
              {shape.icon}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
