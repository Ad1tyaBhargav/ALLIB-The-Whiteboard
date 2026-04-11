import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Circle, Arrow, Transformer } from "react-konva";
import { socket } from "../../../socket";
import { useRoom } from "../../context/RoomContext";
import ImgElement from "./components/ImgElement";
import Toolbar from "./toolbar";

const MIN_DISTANCE = 3;
const EMIT_INTERVAL = 50;
const RENDER_INTERVAL = 50;
const CURSOR_EMIT_INTERVAL = 30;

export default function Board({ user }) {
  const { boardData, setBoardData, roomCode, isLocked, admin } = useRoom();

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const boardRef = useRef([]);
  const activeElementRef = useRef(null);
  const isDrawing = useRef(false);
  const lastEmit = useRef(0);
  const lastRender = useRef(0);
  const lastCursorEmit = useRef(0);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fillEnabled, setFillEnabled] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const isFreehand = ["pencil", "marker", "brush", "sketch", "eraser"].includes(tool);
  const isAdmin = user === admin;

  useEffect(() => {
    boardRef.current = boardData;
  }, [boardData]);

  useEffect(() => {
    const transformer = trRef.current;

    if (transformer && selectedId) {
      const selectedNode = stageRef.current?.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer().batchDraw();
        return;
      }
    }

    transformer?.nodes([]);
    transformer?.getLayer()?.batchDraw();
  }, [selectedId, boardData]);

  const getPoint = () => {
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return null;
    return { x: pointer.x, y: pointer.y };
  };

  const updateBoardElement = (updatedElement, shouldRender = true) => {
    const index = boardRef.current.findIndex((el) => el.id === updatedElement.id);
    if (index === -1) return;

    boardRef.current = [
      ...boardRef.current.slice(0, index),
      updatedElement,
      ...boardRef.current.slice(index + 1),
    ];

    if (shouldRender) {
      setBoardData([...boardRef.current]);
    }
  };

  const createElement = (pos) => {
    if (isFreehand) {
      return {
        id: `line_${Date.now()}_${socket.id}`,
        type: "line",
        points: [pos.x, pos.y],
        color,
        strokeWidth,
        tool,
        createdBy: user,
      };
    }

    return {
      id: `${tool}_${Date.now()}_${socket.id}`,
      type: tool,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: 0,
      points: [pos.x, pos.y, pos.x, pos.y],
      color,
      strokeWidth,
      fillEnabled,
      createdBy: user,
    };
  };

  const updateElementForPoint = (element, pos) => {
    if (element.type === "rectangle") {
      return {
        ...element,
        width: pos.x - element.x,
        height: pos.y - element.y,
      };
    }

    if (element.type === "circle") {
      return {
        ...element,
        radius: Math.sqrt((pos.x - element.x) ** 2 + (pos.y - element.y) ** 2),
      };
    }

    if (element.type === "arrow" || element.type === "line") {
      return {
        ...element,
        points: [element.x, element.y, pos.x, pos.y],
      };
    }

    return element;
  };

  const undo = useCallback(() => {
    if (!roomCode || isLocked) return;
    socket.emit("undo-action", { roomCode });
  }, [isLocked, roomCode]);

  const redo = useCallback(() => {
    if (!roomCode || isLocked) return;
    socket.emit("redo-action", { roomCode });
  }, [isLocked, roomCode]);

  const emitCursorMove = (pos) => {
    if (!roomCode || !pos) return;

    const now = Date.now();
    if (now - lastCursorEmit.current < CURSOR_EMIT_INTERVAL) return;

    socket.emit("cursor-move", {
      roomCode,
      x: pos.x,
      y: pos.y,
    });
    lastCursorEmit.current = now;
  };

  const emitCursorLeave = useCallback(() => {
    if (!roomCode) return;
    socket.emit("cursor-leave", { roomCode });
  }, [roomCode]);

  const handleMouseDown = (e) => {
    if (isLocked || tool === "select" || !roomCode) return;

    const stage = stageRef.current;
    if (e.target === stage) {
      setSelectedId(null);
    }

    const pos = getPoint();
    if (!pos) return;

    const element = createElement(pos);

    isDrawing.current = true;
    activeElementRef.current = element;
    boardRef.current = [...boardRef.current, element];
    setBoardData([...boardRef.current]);
    emitCursorMove(pos);

    if (isFreehand) {
      socket.emit("stroke-start", { roomCode, stroke: element });
    }
  };

  const handleMouseMove = () => {
    const pos = getPoint();
    if (!pos) return;

    emitCursorMove(pos);

    if (isLocked || !isDrawing.current || !activeElementRef.current) return;

    const element = activeElementRef.current;
    let updatedElement = element;

    if (isFreehand) {
      const points = element.points;
      const lastX = points[points.length - 2];
      const lastY = points[points.length - 1];
      const dx = pos.x - lastX;
      const dy = pos.y - lastY;

      if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE) return;

      let nextX = pos.x;
      let nextY = pos.y;

      if (tool === "sketch") {
        nextX += (Math.random() - 0.5) * 1.5;
        nextY += (Math.random() - 0.5) * 1.5;
      }

      updatedElement = {
        ...element,
        points: [...points, nextX, nextY],
      };
    } else {
      updatedElement = updateElementForPoint(element, pos);
    }

    activeElementRef.current = updatedElement;

    const now = Date.now();
    const shouldRender = now - lastRender.current > RENDER_INTERVAL;
    updateBoardElement(updatedElement, shouldRender);

    if (shouldRender) {
      lastRender.current = now;
    }

    if (isFreehand && now - lastEmit.current > EMIT_INTERVAL) {
      socket.emit("stroke-update", {
        roomCode,
        id: updatedElement.id,
        points: updatedElement.points,
      });
      lastEmit.current = now;
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !activeElementRef.current) return;

    const element = activeElementRef.current;
    updateBoardElement(element);

    if (!isLocked) {
      if (isFreehand) {
        socket.emit("stroke-end", { roomCode, stroke: element });
      } else {
        socket.emit("shape-add", { roomCode, shape: element });
      }
    }

    activeElementRef.current = null;
    isDrawing.current = false;
    lastEmit.current = 0;
  };

  const clearCanvas = () => {
    if (!isAdmin) return;

    boardRef.current = [];
    setBoardData([]);
    setSelectedId(null);
    socket.emit("clear-board", { roomCode });
  };

  const handleImageInsert = (src) => {
    if (!roomCode) return;

    const image = {
      id: `image_${Date.now()}_${socket.id}`,
      type: "image",
      x: 200,
      y: 200,
      width: 300,
      height: 300,
      src,
      createdBy: user,
    };

    boardRef.current = [...boardRef.current, image];
    setBoardData([...boardRef.current]);
    socket.emit("image-add", { roomCode, image });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isEditable = target instanceof HTMLElement && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );

      if (isEditable) return;

      const hasModifier = e.ctrlKey || e.metaKey;
      if (!hasModifier) return;

      const key = e.key.toLowerCase();

      if (key === "z") {
        e.preventDefault();

        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }

        return;
      }

      if (key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [redo, undo]);

  useEffect(() => {
    return () => {
      emitCursorLeave();
    };
  }, [emitCursorLeave]);

  const renderElement = (el) => {
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
            points={el.points || []}
            stroke={el.color}
            strokeWidth={
              el.tool === "marker"
                ? el.strokeWidth * 3
                : el.tool === "brush"
                  ? el.strokeWidth * 2
                  : el.strokeWidth
            }
            opacity={
              el.tool === "marker"
                ? 0.4
                : el.tool === "pencil"
                  ? 0.8
                  : 1
            }
            tension={
              el.tool === "pencil"
                ? 0
                : el.tool === "sketch"
                  ? 0.2
                  : 0.6
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
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
            draggable={tool === "select"}
            onClick={() => setSelectedId(el.id)}
            onTap={() => setSelectedId(el.id)}
          />
        );
    }
  };

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
        onUndo={undo}
        onRedo={redo}
        isAdmin={isAdmin}
        stageRef={stageRef}
        isfreehand={isFreehand}
        onImageImport={handleImageInsert}
      />

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isLocked ? "not-allowed" : tool === "select" ? "pointer" : "crosshair" }}
      >
        <Layer>
          {boardData.map(renderElement)}
          <Transformer ref={trRef} rotateEnabled={true} />
        </Layer>
      </Stage>
    </div>
  );
}
