import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { ColorPicker } from "primereact/colorpicker";
import { Slider } from "primereact/slider";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function Toolbar({ onPenChange, onToolChange, clearCanvas }) {
  const [position, setPosition] = useState({ x: 517, y: 543 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [penOpen, setPenOpen] = useState(false);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [activeTool, setActiveTool] = useState("pen");

  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);

  // 🖱️ Dragging logic
  const handleMouseDown = (e) => {
    const isButton = e.target.closest(".p-button");
    const isMenu = e.target.closest(".popup-menu");
    if (isButton || isMenu) return; // prevent drag if clicked a button or menu

    setDragging(true);
    const toolbarEl = e.currentTarget;
    toolbarEl.classList.add("dragging");
    setOffset({
      x: e.clientX - toolbarEl.getBoundingClientRect().left,
      y: e.clientY - toolbarEl.getBoundingClientRect().top,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
    document.querySelector("#toolbar")?.classList.remove("dragging");
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  // 🔁 Sync pen settings
  useEffect(() => {
    onPenChange?.({ color, size });
  }, [color, size]);

  // 🧭 Helper for tool activation
  const activateTool = (tool) => {
    setActiveTool(tool);
    onToolChange(tool);
  };

  return (
    <div
      id="toolbar"
      style={{
        top: position.y,
        left: position.x,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* ✏️ Pen Tool */}
      <Button
        icon="pi pi-pencil"
        className={activeTool === "pen" ? "active-tool" : ""}
        rounded
        outlined
        onClick={() => {
          setPenOpen((prev) => !prev);
          setShapeOpen(false);
          activateTool("pen");
        }}
      />

      {/* 🧱 Shape Tool */}
      <Button
        icon="pi pi-stop"
        className={activeTool.includes("shape") ? "active-tool" : ""}
        rounded
        outlined
        onClick={() => {
          setShapeOpen((prev) => !prev);
          setPenOpen(false);
        }}
      />

      {/* 🔲 Select / Resize Tool */}
      <Button
        icon="pi pi-arrow-up-left"
        className={activeTool === "select" ? "active-tool" : ""}
        rounded
        outlined
        onClick={() => activateTool("select")}
      />

      {/* 🧽 Eraser */}
      <Button
        icon="pi pi-eraser"
        className={activeTool === "eraser" ? "active-tool" : ""}
        rounded
        outlined
        onClick={() => activateTool("eraser")}
      />

      {/* 🧹 Clear Canvas */}
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={clearCanvas}
      />

      {/* 🎨 Pen Settings Popup */}
      {penOpen && (
        <div className="popup-menu pen-settings">
          <div className="pen-setting-group">
            <label>Color</label>
            <ColorPicker
              value={color}
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

      {/* 🧱 Shape Selection Popup */}
      {shapeOpen && (
        <div className="popup-menu shape-menu">
          <div
            className={`shape-option ${
              activeTool === "line" ? "shape-active" : ""
            }`}
            onClick={() => activateTool("line")}
          >
            ➖ Line
          </div>
          <div
            className={`shape-option ${
              activeTool === "rectangle" ? "shape-active" : ""
            }`}
            onClick={() => activateTool("rectangle")}
          >
            ⬛ Rectangle
          </div>
          <div
            className={`shape-option ${
              activeTool === "circle" ? "shape-active" : ""
            }`}
            onClick={() => activateTool("circle")}
          >
            ⚪ Circle
          </div>
          <div
            className={`shape-option ${
              activeTool === "arrow" ? "shape-active" : ""
            }`}
            onClick={() => activateTool("arrow")}
          >
            ➤ Arrow
          </div>
        </div>
      )}
    </div>
  );
}
