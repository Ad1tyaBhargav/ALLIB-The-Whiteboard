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
  isfreehand
}) {
  const [position, setPosition] = useState({ x: 500, y: 500 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [penOpen, setPenOpen] = useState(false);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [activeTool, setActiveTool] = useState("pencil"); //change it to pencil

  const [color, setColor] = useState("#ce0202");
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
    setShapeOpen(false);
  };

  /* ================= Export ================= */

  const exportBoard = () => {
    const stage = stageRef.current;
    if (!stage) return null;

    const PREVIEW_WIDTH = 1200;
    const PREVIEW_HEIGHT = 675;

    // 🔴 RESET TRANSFORM
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();

    const background = new window.Konva.Rect({
      x: 0,
      y: 0,
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
      fill: "#ffffff",
    });

    stage.getLayers()[0].add(background);
    background.moveToBottom();
    stage.batchDraw();

    const dataURL = stage.toDataURL({
      x: 0,
      y: 0,
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
      pixelRatio: 1,
    });

    background.destroy();
    stage.batchDraw();

    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = dataURL;
    link.click();
  };

  /* ================= Render ================= */

  return (
    <div
      className="position-absolute bg-dark rounded-pill shadow px-3 py-3 d-flex align-items-center justify-content-around"
      style={{
        top: position.y,
        left: position.x,
        zIndex: 9995,
        cursor: dragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Pen */}
      <Button
        icon="pi pi-pencil"
        className={`${isfreehand ? "active-tool" : ""} rounded-circle`}
        onClick={() => {
          setPenOpen((prev) => !prev);
          setShapeOpen(false);
        }}
        tooltip="Pen Style"
        tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
      />

      <ColorPicker
        value={color.replace("#", "")}
        onChange={(e) => setColor("#" + e.value)}
        style={{
          width: "9%",
          height: "65%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
        inputClassName={""}
        className="custom-colorpicker"
        tooltip="Color Pallete"
        tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
      />


      {/* Shape */}
      <Button
        icon="pi pi-stop"
        className={`${!isfreehand ? "active-tool" : ""} rounded-circle`}
        onClick={() => {
          setShapeOpen((prev) => !prev);
          setPenOpen(false);
        }}
        tooltip="Shapes"
        tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
      />

      {/* Eraser */}
      <Button
        icon="pi pi-eraser"
        className={`${activeTool === "eraser" ? "active-tool" : ""} rounded-circle`}
        onClick={() => activateTool("eraser")}
        tooltip="Earser"
        tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
      />

      {/* Fill Toggle */}
      <Button
        icon="pi pi-palette"
        severity={fillEnabled ? "success" : "secondary"}
        className={`${fillEnabled && "active-tool"} rounded-circle`}
        onClick={() => setFillEnabled((prev) => !prev)}
        tooltip="Toggle Fill"
        tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
      />

      {/* Export */}
      <Button
        icon="pi pi-download"
        severity="info"
        className="rounded-circle"
        onClick={exportBoard}
        tooltip="Export Image"
        tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
      />

      {/* Clear (Admin Only) */}
      <Button
        icon="pi pi-trash"
        severity="danger"
        className="rounded-circle"
        tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
        disabled={!isAdmin}
        onClick={() => {
          if (isAdmin) clearCanvas();
        }}
        tooltip="Clear Canvas (Admin Only)"
      />

      {/* Pen Popup */}
      {penOpen && (
        <div className="popup-menu p-3 d-flex flex-column gap-2 m-3">

          <div className=" d-flex gap-2 ">
            {[{ name: "pencil", icon: "✏️" }, { name: "marker", icon: "🖍️" }, { name: "brush", icon: "🖌️" }, { name: "sketch", icon: "🖊️" }].map(type => (
              <Button
                key={type.name}
                label={type.icon}
                size="small"
                tooltip={type.name}
                tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
                className={`${activeTool === type.name ? "active-tool" : ""} px-4 py-2 rounded-pill`}
                onClick={() => activateTool(type.name)}
              />
            ))}
          </div>

          <div className="pen-setting-group p-3">
            <label className="pb-2">Pen Size: {size}</label>
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
        <div className="popup-menu d-flex gap-2 m-3">
          {[{ name: "line", icon: "---" }, { name: "rectangle", icon: "🔲" }, { name: "circle", icon: "⚪" }, { name: "arrow", icon: "➡️" }].map((shape) => (
            <Button
              key={shape.name}
              label={shape.icon}
              size="small"
              tooltip={shape.name}
              tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
              className={`px-4 py-2 rounded-pill ${activeTool === shape.name ? "shape-active" : ""}`}
              onClick={() => activateTool(shape.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
