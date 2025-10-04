import React from "react";
import { usePanning } from "../hooks/usePanning";

type PannableBackgroundRenderProps = {
  offset: { x: number; y: number };
  isPanning: boolean;
  setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
};

type PannableBackgroundProps = {
  className?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  children?: React.ReactNode | ((props: PannableBackgroundRenderProps) => React.ReactNode);
};

export function PannableBackground({
  className = "relative w-full h-full",
  backgroundImage = "radial-gradient(circle, rgba(0,0,0,0.2) 2px, transparent 1px)",
  backgroundSize = "30px 30px",
  children,
}: PannableBackgroundProps) {
  const { offset, isPanning, handlers, setOffset } = usePanning();

  const renderedChildren =
    typeof children === "function"
      ? (children as (props: PannableBackgroundRenderProps) => React.ReactNode)({
          offset,
          isPanning,
          setOffset,
        })
      : children;

  return (
    <div
      className={className}
      style={{
        backgroundImage,
        backgroundSize,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
        cursor: isPanning ? "grabbing" : "grab",
        userSelect: isPanning ? "none" : "auto",
        touchAction: "none",
      }}
      {...handlers}
    >
      {renderedChildren}
    </div>
  );
}


