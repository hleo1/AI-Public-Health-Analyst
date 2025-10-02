import React, { useRef, useState } from "react";

type Point = { x: number; y: number };

export function usePanning(initialOffset: Point = { x: 0, y: 0 }) {
  const [isPanning, setIsPanning] = useState(false);
  const [offset, setOffset] = useState<Point>(initialOffset);

  const startPointerRef = useRef<Point | null>(null);
  const startOffsetRef = useRef<Point>(initialOffset);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsPanning(true);
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { ...offset };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !startPointerRef.current) return;
    const dx = e.clientX - startPointerRef.current.x;
    const dy = e.clientY - startPointerRef.current.y;
    setOffset({ x: startOffsetRef.current.x + dx, y: startOffsetRef.current.y + dy });
  };

  const endPan = (e?: React.PointerEvent<HTMLDivElement>) => {
    setIsPanning(false);
    startPointerRef.current = null;
    if (e) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  const handlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: endPan,
    onPointerCancel: endPan,
    onPointerLeave: endPan,
  } as const;

  return { offset, isPanning, handlers, setOffset } as const;
}


