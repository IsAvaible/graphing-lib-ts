import React, { useState, useRef, useEffect, useCallback } from "react";

interface SubWindowProps {
  title: string;
  children: React.ReactNode;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
}

export const SubWindow: React.FC<SubWindowProps> = ({
  title,
  children,
  defaultX = 20,
  defaultY = 100,
  defaultWidth = 400,
  defaultHeight = 300
}) => {
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({
    width: defaultWidth,
    height: defaultHeight
  });

  const stateRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialW: 0,
    initialH: 0
  });

  // Handlers for Dragging
  const onDragMove = useCallback((e: PointerEvent) => {
    const { startX, startY, initialX, initialY } = stateRef.current;
    setPosition({
      x: initialX + (e.clientX - startX),
      y: initialY + (e.clientY - startY)
    });
  }, []);

  const onDragEnd = useCallback(() => {
    document.removeEventListener("pointermove", onDragMove);
    document.removeEventListener("pointerup", onDragEnd);
  }, [onDragMove]);

  const onDragStart = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    stateRef.current = {
      ...stateRef.current,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
    document.addEventListener("pointermove", onDragMove);
    document.addEventListener("pointerup", onDragEnd);
  };

  // Handlers for Resizing
  const onResizeMove = useCallback((e: PointerEvent) => {
    const { startX, startY, initialW, initialH } = stateRef.current;
    setSize({
      width: Math.max(200, initialW + (e.clientX - startX)),
      height: Math.max(150, initialH + (e.clientY - startY))
    });
  }, []);

  const onResizeEnd = useCallback(() => {
    document.removeEventListener("pointermove", onResizeMove);
    document.removeEventListener("pointerup", onResizeEnd);
  }, [onResizeMove]);

  const onResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation(); // Prevent drag start
    stateRef.current = {
      ...stateRef.current,
      startX: e.clientX,
      startY: e.clientY,
      initialW: size.width,
      initialH: size.height
    };
    document.addEventListener("pointermove", onResizeMove);
    document.addEventListener("pointerup", onResizeEnd);
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", onDragMove);
      document.removeEventListener("pointerup", onDragEnd);
      document.removeEventListener("pointermove", onResizeMove);
      document.removeEventListener("pointerup", onResizeEnd);
    };
  }, [onDragMove, onDragEnd, onResizeMove, onResizeEnd]);

  return (
    <div
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height
      }}
      className="fixed z-50 bg-white border border-gray-300 shadow-2xl rounded-md flex flex-col overflow-hidden"
    >
      <div
        onPointerDown={onDragStart}
        className="bg-gray-100 border-b border-gray-300 p-2 cursor-move flex justify-between items-center select-none touch-none"
      >
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          {title}
        </span>
      </div>

      <div className="grow relative overflow-hidden bg-gray-50">{children}</div>

      {/* Resize Handle */}
      <div
        onPointerDown={onResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize touch-none flex items-end justify-end p-1"
      >
        <div className="w-2 h-2 bg-gray-400 rounded-sm clip-triangle" />
      </div>
    </div>
  );
};
