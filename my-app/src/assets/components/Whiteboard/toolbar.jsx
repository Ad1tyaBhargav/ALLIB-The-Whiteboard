import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { ColorPicker } from 'primereact/colorpicker';
import { Slider } from 'primereact/slider';

const MOBILE_BREAKPOINT = 768;

const DRAWING_TOOLS = [
  { name: 'pencil', label: 'Pencil' },
  { name: 'marker', label: 'Marker' },
  { name: 'brush', label: 'Brush' },
  { name: 'sketch', label: 'Sketch' },
];

const SHAPE_TOOLS = [
  { name: 'line', label: 'Line' },
  { name: 'rectangle', label: 'Rectangle' },
  { name: 'circle', label: 'Circle' },
  { name: 'arrow', label: 'Arrow' },
];

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const getViewportMetrics = () => {
  const viewport = window.visualViewport;

  return {
    width: Math.round(viewport?.width || window.innerWidth),
    height: Math.round(viewport?.height || window.innerHeight),
  };
};

const getDefaultPosition = (width, height) => (
  width < MOBILE_BREAKPOINT
    ? { x: 12, y: Math.max(12, height - 180) }
    : { x: 96, y: 20 }
);

const clampToolbarPosition = (nextX, nextY, nextViewport) => {
  const maxX = Math.max(12, nextViewport.width - 360);
  const maxY = Math.max(12, nextViewport.height - 180);

  return {
    x: Math.min(Math.max(12, nextX), maxX),
    y: Math.min(Math.max(12, nextY), maxY),
  };
};

function ToolbarGroup({ children, isMobile }) {
  return (
    <div
      data-toolbar-interactive="true"
      className={joinClasses(
        'toolbar-control flex flex-none items-center gap-2 rounded-xl border border-black/10 bg-white/55 p-2',
        isMobile ? 'flex-row' : 'flex-col',
      )}
    >
      {children}
    </div>
  );
}

function ToolbarIconButton({
  icon,
  label,
  isActive = false,
  onClick,
  disabled = false,
  extraClassName = '',
}) {
  return (
    <Button
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      data-toolbar-interactive="true"
      aria-label={label}
      tooltip={label}
      tooltipOptions={{ position: 'top', baseZIndex: 9999 }}
      className={joinClasses(
        'toolbar-control !m-0 !flex !h-10 !w-10 !min-w-10 !items-center !justify-center !rounded-lg !border !p-0 !text-black transition-all duration-200',
        isActive
          ? '!border-blue-500/80 !bg-blue-600/70 !text-blue-300 hover:!bg-blue-500/70'
          : '!border-black/15 !bg-black/50  hover:!bg-blue-600/70',
        disabled && '!cursor-not-allowed !opacity-40 hover:!bg-white/70',
        extraClassName,
      )}
    />
  );
}

function ToolbarOptionButton({ label, isActive, onClick, icon }) {
  return (
    <Button
      label={label}
      icon={icon}
      onClick={onClick}
      data-toolbar-interactive="true"
      className={joinClasses(
        'toolbar-control !m-0 !w-full !justify-start !rounded-lg !border !px-3 !py-2 !text-sm  transition-all duration-200',
        isActive
          ? '!border-blue-500/80 !bg-blue-600/70 !text-blue-300 hover:!bg-blue-500/70 '
          : '!border-black/15 !bg-black/50  hover:!bg-blue-600/70 ',
      )}
    />
  );
}

function ToolbarPanel({ title, description, isMobile, children }) {
  return (
    <div
      className={joinClasses(
        'toolbar-menu absolute z-[10000] rounded-xl border border-black/10 bg-white/75 p-3 text-black shadow-lg shadow-black/20 backdrop-blur-md',
        isMobile
          ? 'bottom-full left-1/2 mb-3 w-[92vw] max-w-[20rem] -translate-x-1/2'
          : 'left-0 top-full mt-3 w-72',
      )}
    >
      <div className="mb-3 flex flex-col gap-1">
        <span className="text-sm font-semibold text-black">{title}</span>
        {description ? (
          <span className="text-xs text-black/65">{description}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default function Toolbar({
  onPenChange,
  onToolChange,
  clearCanvas,
  isAdmin,
  stageRef,
  isfreehand,
  onImageImport,
}) {
  const [viewport, setViewport] = useState(getViewportMetrics);
  const [position, setPosition] = useState(() => {
    const { width, height } = getViewportMetrics();
    return getDefaultPosition(width, height);
  });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [penOpen, setPenOpen] = useState(false);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('pencil');
  const [color, setColor] = useState('#ce0202');
  const [size, setSize] = useState(4);
  const [fillEnabled, setFillEnabled] = useState(false);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const isMobile = viewport.width < MOBILE_BREAKPOINT;

  const handlePointerDown = (e) => {
    if (isMobile) return;
    if (e.target.closest('[data-toolbar-interactive="true"]')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragging(true);
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handlePointerMove = useCallback((e) => {
    if (!dragging || isMobile) return;

    setPosition(clampToolbarPosition(
      e.clientX - offset.x,
      e.clientY - offset.y,
      viewport,
    ));
  }, [dragging, isMobile, offset.x, offset.y, viewport]);

  const handlePointerUp = () => setDragging(false);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove]);

  useEffect(() => {
    const syncViewport = () => {
      const nextViewport = getViewportMetrics();
      setViewport(nextViewport);
      setPosition((prev) => (
        nextViewport.width < MOBILE_BREAKPOINT
          ? getDefaultPosition(nextViewport.width, nextViewport.height)
          : clampToolbarPosition(prev.x, prev.y, nextViewport)
      ));
    };

    syncViewport();

    window.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('resize', syncViewport);

    return () => {
      window.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('resize', syncViewport);
    };
  }, []);

  useEffect(() => {
    onPenChange?.({ color, size, fillEnabled });
  }, [color, size, fillEnabled, onPenChange]);

  const activateTool = (tool) => {
    setActiveTool(tool);
    onToolChange(tool);
    setShapeOpen(false);
  };

  const togglePenPanel = () => {
    setPenOpen((prev) => !prev);
    setShapeOpen(false);
    setActionsOpen(false);
  };

  const toggleShapePanel = () => {
    setShapeOpen((prev) => !prev);
    setPenOpen(false);
    setActionsOpen(false);
  };

  const toggleActionsPanel = () => {
    setActionsOpen((prev) => !prev);
    setPenOpen(false);
    setShapeOpen(false);
  };

  const exportBoard = () => {
    const stage = stageRef.current;
    if (!stage) return null;

    const PREVIEW_WIDTH = 1200;
    const PREVIEW_HEIGHT = 675;

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();

    const background = new window.Konva.Rect({
      x: 0,
      y: 0,
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
      fill: '#ffffff',
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

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = dataURL;
    link.click();
  };

  const handleImageUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      onImageImport(e.target.result);
    };

    reader.readAsDataURL(file);
  };

  const penModeActive = isfreehand && activeTool !== 'eraser';

  const shellClasses = joinClasses(
    'toolbar-shell relative flex items-center gap-3 overflow-x-auto border border-black/10 bg-white/70 p-3 text-black shadow-lg shadow-black/20 backdrop-blur-md',
    isMobile ? 'rounded-[24px]' : 'rounded-xl',
  );

  const groupOrientation = true;

  return (
    <div
      ref={containerRef}
      className="absolute"
      style={{
        top: isMobile ? 'auto' : position.y,
        left: isMobile ? '50%' : position.x,
        bottom: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 12px)' : undefined,
        transform: isMobile ? 'translateX(-50%)' : undefined,
        zIndex: 9995,
        width: isMobile ? 'min(calc(100vw - 24px), 560px)' : undefined,
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      {penOpen ? (
        <ToolbarPanel
          title="Brush Settings"
          description="Choose a freehand tool and tune its stroke width."
          isMobile={isMobile}
        >
          <div className="grid grid-cols-2 gap-2">
            {DRAWING_TOOLS.map((tool) => (
              <ToolbarOptionButton
                key={tool.name}
                label={tool.label}
                icon={tool.name === activeTool ? 'pi pi-check' : undefined}
                isActive={activeTool === tool.name}
                onClick={() => activateTool(tool.name)}
              />
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-black/10 bg-white/55 p-3">
            <div className="mb-2 flex items-center justify-between text-sm text-black">
              <span>Pen size</span>
              <span className="text-black/65">{size}px</span>
            </div>
            <Slider
              value={size}
              onChange={(e) => setSize(e.value)}
              min={1}
              max={30}
            />
          </div>
        </ToolbarPanel>
      ) : null}

      {shapeOpen ? (
        <ToolbarPanel
          title="Shapes"
          description="Pick a shape tool without covering the canvas."
          isMobile={isMobile}
        >
          <div className="grid grid-cols-2 gap-2">
            {SHAPE_TOOLS.map((shape) => (
              <ToolbarOptionButton
                key={shape.name}
                label={shape.label}
                icon={shape.name === activeTool ? 'pi pi-check' : undefined}
                isActive={activeTool === shape.name}
                onClick={() => activateTool(shape.name)}
              />
            ))}
          </div>
        </ToolbarPanel>
      ) : null}

      {actionsOpen && isMobile ? (
        <ToolbarPanel
          title="Board Actions"
          description="Quick actions are tucked away here to keep mobile uncluttered."
          isMobile={isMobile}
        >
          <div className="flex flex-col gap-2">
            <ToolbarOptionButton
              label="Import Image"
              icon="pi pi-image"
              isActive={false}
              onClick={() => {
                fileInputRef.current?.click();
                setActionsOpen(false);
              }}
            />
            <ToolbarOptionButton
              label="Export Image"
              icon="pi pi-download"
              isActive={false}
              onClick={() => {
                exportBoard();
                setActionsOpen(false);
              }}
            />
            <ToolbarOptionButton
              label={isAdmin ? 'Clear Canvas' : 'Clear Canvas (Admin Only)'}
              icon="pi pi-trash"
              isActive={false}
              onClick={() => {
                if (isAdmin) {
                  clearCanvas();
                }
                setActionsOpen(false);
              }}
            />
          </div>
        </ToolbarPanel>
      ) : null}

      <div
        className={joinClasses(
          shellClasses,
          !isMobile && (dragging ? 'cursor-grabbing' : 'cursor-grab'),
        )}
        onPointerDown={handlePointerDown}
      >
        <ToolbarGroup isMobile={groupOrientation}>
          <ToolbarIconButton
            icon="pi pi-pencil"
            label="Brush Settings"
            isActive={penModeActive || penOpen}
            onClick={togglePenPanel}
          />
          <ToolbarIconButton
            icon="pi pi-stop"
            label="Shape Tools"
            isActive={!isfreehand || shapeOpen}
            onClick={toggleShapePanel}
          />
          <ToolbarIconButton
            icon="pi pi-eraser"
            label="Eraser"
            isActive={activeTool === 'eraser'}
            onClick={() => activateTool('eraser')}
          />
        </ToolbarGroup>

        <ToolbarGroup isMobile={groupOrientation}>
          <div
            data-toolbar-interactive="true"
            className="toolbar-control flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-black/15 bg-white/70"
          >
            <ColorPicker
              value={color.replace('#', '')}
              onChange={(e) => setColor(`#${e.value}`)}
              className="toolbar-control !text-black"
              tooltip="Color Palette"
              tooltipOptions={{ baseZIndex: 9999, position: 'top' }}
            />
          </div>
          <ToolbarIconButton
            icon="pi pi-palette"
            label={fillEnabled ? 'Disable Fill' : 'Enable Fill'}
            isActive={fillEnabled}
            onClick={() => setFillEnabled((prev) => !prev)}
          />
        </ToolbarGroup>

        {isMobile ? (
          <ToolbarGroup isMobile={groupOrientation}>
            <ToolbarIconButton
              icon="pi pi-ellipsis-h"
              label="More Actions"
              isActive={actionsOpen}
              onClick={toggleActionsPanel}
            />
          </ToolbarGroup>
        ) : (
          <ToolbarGroup isMobile={groupOrientation}>
            <ToolbarIconButton
              icon="pi pi-image"
              label="Import Image"
              onClick={() => fileInputRef.current?.click()}
            />
            <ToolbarIconButton
              icon="pi pi-download"
              label="Export Image"
              onClick={exportBoard}
            />
            <ToolbarIconButton
              icon="pi pi-trash"
              label={isAdmin ? 'Clear Canvas' : 'Clear Canvas (Admin Only)'}
              extraClassName={isAdmin ? 'hover:!bg-red-100' : ''}
              disabled={!isAdmin}
              onClick={() => {
                if (isAdmin) clearCanvas();
              }}
            />
          </ToolbarGroup>
        )}

        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={(e) => handleImageUpload(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
