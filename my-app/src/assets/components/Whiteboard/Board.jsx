import { useEffect, useRef, useState } from "react";
import { Arrow, Circle, Layer, Line, Rect, Stage, Transformer} from "react-konva";
import { socket } from "../../../socket";
import { useRoom } from "../../context/RoomContext";
import ImgElement from "./components/ImgElement";
import Toolbar from "./toolbar";

export default function Board({ user }) {

  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState("pencil");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [selectedId, setSelectedId] = useState(null);
  const [fillEnabled, setFillEnabled] = useState(false);
  const { boardData, setBoardData, roomCode, isLocked, setViewport, admin } = useRoom()
  const isFreehand = ["pencil", "marker", "brush", "sketch", "spray", "eraser"].includes(tool);

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const currentStrokeRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const EMIT_INTERVAL = 25;
  const MIN_DISTANCE = 2;
  const lastCursorEmitRef = useRef(0);
  const CURSOR_EMIT_INTERVAL = 30;
  const isSpacePressed = useRef(false);
  const isAdmin = user === admin;

  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  // Utility: get pointer position relative to scale
  const getRelativePointer = (stage) => {
    const pointer = stage.getPointerPosition();
    return {
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    };
  };

  // ✅ Start drawing
  const handleMouseDown = (e) => {
    if (isPanning.current || isLocked) return;

    const stage = stageRef.current;
    const pos = getRelativePointer(stage);
    const clickedOnEmpty = e.target === stage;

    if (clickedOnEmpty) {
      setSelectedId(null);
    }

    if (tool === "select") return; // skip drawing

    isDrawing.current = true;

    // Shape creation logic
    if (isFreehand) {
      const stroke = {
        id: `line_${Date.now()}_${socket.id}`,
        type: "line",
        points: [pos.x, pos.y],
        color,
        strokeWidth,
        tool,
        createdBy: user
      };

      currentStrokeRef.current = stroke;

      setBoardData(prev => [...prev, stroke]);

      socket.emit("stroke-start", { roomCode, stroke });
    } else {
      // shapes
      setBoardData((prev) => [
        ...prev,
        {
          id: `${tool}_${Date.now()}_${socket.id}`,
          type: tool,
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          points: [pos.x, pos.y],
          color,
          strokeWidth,
          fillEnabled,
          createdBy: user
        },
      ]);
    }
  };

  // ✅ Continue drawing
  const handleMouseMove = (e) => {
    const stage = e.target.getStage();

    // 🔵 CURSOR EMIT (always)
    const nowCursor = Date.now();
    if (nowCursor - lastCursorEmitRef.current > CURSOR_EMIT_INTERVAL) {
      const boardPos = getRelativePointer(stage);
      socket.emit("cursor-move", {
        roomCode,
        x: boardPos.x,
        y: boardPos.y,
      });
      lastCursorEmitRef.current = nowCursor;
    }

    // ❌ if not drawing, stop here
    if (!isDrawing.current || isLocked) return;

    const point = getRelativePointer(stage);

    // =========================
    // ✏️ FREEHAND (pen / eraser)
    // =========================
    if (isFreehand && currentStrokeRef.current) {
      const prevStroke = currentStrokeRef.current;
      const pts = prevStroke.points;
      const lastX = pts[pts.length - 2];
      const lastY = pts[pts.length - 1];

      const dx = point.x - lastX;
      const dy = point.y - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MIN_DISTANCE) return;

      let newX = point.x;
      let newY = point.y;

      if (tool === "sketch") {
        newX += (Math.random() - 0.5) * 1.5;
        newY += (Math.random() - 0.5) * 1.5;
      }

      const newPoints = [...pts, newX, newY];

      const updatedStroke = {
        ...prevStroke,
        points: newPoints,
      };

      currentStrokeRef.current = updatedStroke;

      setBoardData(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = updatedStroke;
        return copy;
      });

      const now = Date.now();
      if (now - lastEmitTimeRef.current > EMIT_INTERVAL) {
        socket.emit("stroke-update", {
          roomCode,
          id: updatedStroke.id,
          points: newPoints,
        });
        lastEmitTimeRef.current = now;
      }

      return; // IMPORTANT
    }

    // =========================
    // 📐 SHAPES (rect, circle…)
    // =========================
    setBoardData(prev => {
      const last = prev[prev.length - 1];
      if (!last) return prev;

      let updated = last;

      if (last.type === "rectangle") {
        updated = {
          ...last,
          width: point.x - last.x,
          height: point.y - last.y,
        };
      }

      if (last.type === "circle") {
        const radius = Math.sqrt(
          (point.x - last.x) ** 2 + (point.y - last.y) ** 2
        );
        updated = { ...last, radius };
      }

      if (last.type === "arrow") {
        updated = {
          ...last,
          points: [last.x, last.y, point.x, point.y],
        };
      }

      return [...prev.slice(0, -1), updated];
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;

    // 🟢 PEN / ERASER
    if ((tool === "pen" || tool === "eraser") && currentStrokeRef.current) {
      socket.emit("stroke-end", {
        roomCode,
        stroke: currentStrokeRef.current,
      });
      currentStrokeRef.current = null;
    }

    // 🔷 SHAPES (sync once)
    if (tool !== "pen" && tool !== "eraser") {
      const lastShape = boardData[boardData.length - 1];
      if (lastShape) {
        socket.emit("shape-add", {
          roomCode,
          shape: lastShape,
        });
      }
    }

    isDrawing.current = false;
    socket.emit("cursor-leave", { roomCode });
  };

  // ✅ Undo / Redo
  const undo = () => {
    socket.emit("undo-action", { roomCode });
  };

  const redo = () => {
    socket.emit("redo-action", { roomCode });
  };

  // ✅ Clear Canvas
  const clearCanvas = () => {
    if (user !== admin) return;

    setBoardData([]);
    setSelectedId(null);

    socket.emit("clear-board", { roomCode });

  };

  // ✅ Handle zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stageScale;
    const scaleBy = 1.05;

    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePosition(newPos);
  };

  // ✅ Panning
  const handleStageMouseDown = (e) => {
    if (isPanning.current) return;
    if (isSpacePressed.current) isPanning.current = true;
  };

  const handleStageMouseUp = () => {
    isPanning.current = false;
  };

  const handleStageMouseMove = (e) => {
    if (!isPanning.current) return;
    setStagePosition((prev) => ({
      x: prev.x + e.evt.movementX,
      y: prev.y + e.evt.movementY,
    }));
  };

  const exportBoardPreview = () => {
    const stage = stageRef.current;
    if (!stage) return null;

    const oldScale = stage.scaleX();
    const oldPos = stage.position();

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
      pixelRatio: 0.3,
    });

    background.destroy();
    stage.batchDraw();

    // 🔵 RESTORE TRANSFORM
    stage.scale({ x: oldScale, y: oldScale });
    stage.position(oldPos);
    stage.batchDraw();

    return dataURL;
  };

  const handleImageInsert = (src) => {
    const stage = stageRef.current;

    const imageElement = {
      id: `image_${Date.now()}_${socket.id}`,
      type: "image",
      x: 200,
      y: 200,
      width: 300,
      height: 300,
      src,
      createdBy: user
    };

    setBoardData(prev => [...prev, imageElement]);

    socket.emit("image-add", {
      roomCode,
      image: imageElement
    });
  };

  //keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) undo();
      if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "Z")) redo();
      if (e.key === "Delete" && selectedId)
        setBoardData((prev) => prev.filter((el) => el.id !== selectedId));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Transformer (for selection)
  useEffect(() => {
    const transformer = trRef.current;
    if (transformer && selectedId) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer().batchDraw();
      }
    } else {
      transformer?.nodes([]);
      transformer?.getLayer()?.batchDraw();
    }
  }, [selectedId, boardData]);

  //Panning logic with keyboard bound
  useEffect(() => {
    const down = e => { if (e.code === "Space") isSpacePressed.current = true; };
    const up = e => { if (e.code === "Space") isSpacePressed.current = false; };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  //for cursor
  useEffect(() => {
    return () => {
      socket.emit("cursor-leave", { roomCode });
    };
  }, [roomCode]);

  //preview generator
  useEffect(() => {
    const handlePreviewRequest = async () => {
      const preview = exportBoardPreview();
      if (!preview) return;

      socket.emit("board-preview", {
        roomCode,
        image: preview,
      });
    };

    socket.on("request-board-preview", handlePreviewRequest);

    return () => {
      socket.off("request-board-preview", handlePreviewRequest);
    };
  }, [roomCode]);

  useEffect(() => {
    setViewport({
      scale: stageScale,
      x: stagePosition.x,
      y: stagePosition.y,
    });
  }, [stageScale, stagePosition]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#fff", overflow: "hidden" }}>

      <Toolbar
        onPenChange={({ color, size, fillEnabled }) => {
          if (color !== undefined) setColor(color);
          if (size !== undefined) setStrokeWidth(size);
          if (fillEnabled !== undefined) setFillEnabled(fillEnabled);
        }}

        onToolChange={setTool}
        clearCanvas={clearCanvas}
        isAdmin={isAdmin}
        stageRef={stageRef}
        isfreehand={isFreehand}
        onImageImport={handleImageInsert}
      />



      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onPointerDown={handleStageMouseDown}
        onPointerUp={handleStageMouseUp}
        onPointerMove={handleStageMouseMove}
        style={{ cursor: isPanning.current ? "grab" : tool === "select" ? "pointer" : "crosshair" }}
      >
        <Layer>
          {boardData.map((el) => {
            switch (el.type) {
              case "rectangle":
                return (
                  <Rect
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    fill={el.fillEnabled ? el.color : undefined}
                    draggable={tool === "select"}
                    onClick={() => setSelectedId(el.id)}
                    onTap={() => setSelectedId(el.id)}
                  />
                );
              case "circle":
                return (
                  <Circle
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    radius={el.radius || 0}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    fill={el.fillEnabled ? el.color : undefined}
                    draggable={tool === "select"}
                    onClick={() => setSelectedId(el.id)}
                    onTap={() => setSelectedId(el.id)}
                  />
                );
              case "arrow":
                return (
                  <Arrow
                    key={el.id}
                    id={el.id}
                    points={el.points}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    fill={el.color}
                    draggable={tool === "select"}
                    onClick={() => setSelectedId(el.id)}
                    onTap={() => setSelectedId(el.id)}
                  />
                );
              case "image":
                return (
                  <ImgElement
                    key={el.id}
                    el={el}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                  />
                );
              default:
                return (
                  <Line
                    key={el.id}
                    id={el.id}
                    points={el.points}
                    stroke={el.color}
                    strokeWidth={
                      el.tool === "marker" ? el.strokeWidth * 3 :
                        el.tool === "brush" ? el.strokeWidth * 2 :
                          el.strokeWidth
                    }
                    opacity={
                      el.tool === "marker" ? 0.4 :
                        el.tool === "pencil" ? 0.8 :
                          1
                    }
                    tension={
                      el.tool === "pencil" ? 0 :
                        el.tool === "sketch" ? 0.2 :
                          0.6
                    }
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      el.tool === "eraser"
                        ? "destination-out"
                        : el.tool === "marker"
                          ? "multiply"
                          : "source-over"
                    }
                    draggable={tool === "select"}
                    onClick={() => setSelectedId(el.id)}
                    onTap={() => setSelectedId(el.id)}
                  />
                );
            }
          })}
          <Transformer ref={trRef} rotateEnabled={true} />
        </Layer>
      </Stage>
    </div>
  );
}