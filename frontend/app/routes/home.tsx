import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

import { useState, useRef, useEffect } from "react";

type BlockStatus = "idle" | "processing" | "done" | "error";
type BlockType = "dataBlock" | "process";
type CanvasBlock = {
  id: number;
  x: number;
  y: number;
  label: string;
  type: BlockType;
  fileName?: string;
  progress?: number;
  status?: BlockStatus;
  isDragOver?: boolean;
  columns?: string[];
};

function DataBlock() {
  return(<></>)
}

export default function Canvas() {
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // canvas panning
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  const [blocks, setBlocks] = useState<CanvasBlock[]>([
    { id: 1, x: 100, y: 100, label: "📂 Data Block", type: "dataBlock", fileName: "", progress: 0, status: "idle", isDragOver: false, columns: [] },
    { id: 2, x: 300, y: 200, label: "⚙️ Process Block", type: "process", fileName: "", progress: 0, status: "idle", isDragOver: false, columns: [] },
  ]);

  // Handle panning background
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.block) return; // skip if dragging block
    setIsPanning(true);
    panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Handle dragging blocks
  const handleBlockDrag = (id: number, e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;

    const block = blocks.find((b) => b.id === id)!;
    const startBlockX = block.x;
    const startBlockY = block.y;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setBlocks((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, x: startBlockX + dx, y: startBlockY + dy } : b
        )
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Read file in chunks to provide progress feedback
  const readFileWithProgress = async (
    file: File,
    onProgress: (percent: number) => void
  ) => {
    const chunkSize = 1024 * 1024; // 1MB
    let offset = 0;
    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize);
      // eslint-disable-next-line no-await-in-loop
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve();
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(slice);
      });
      offset += chunkSize;
      const percent = Math.min(100, Math.round((offset / file.size) * 100));
      onProgress(percent);
    }
  };

  const handleFileDrop = async (block: CanvasBlock, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, isDragOver: false } : b)));

    if (block.type !== "dataBlock") return; // ignore drops on non-data blocks

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const isXpt = file.name.toLowerCase().endsWith(".xpt");
    if (!isXpt) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === block.id ? { ...b, fileName: file.name, status: "error", progress: 0, columns: [] } : b))
      );
      return;
    }

    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? { ...b, fileName: file.name, status: "processing", progress: 0, columns: [] } : b))
    );

    try {
      await readFileWithProgress(file, (p) => {
        setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, progress: p } : b)));
      });
      // Parse dropped XPT on the frontend and extract column names
      const arrayBuffer = await file.arrayBuffer();
      const { default: Library } = await import("xport-js");
      const lib = new Library(arrayBuffer as ArrayBuffer);
      const metadata: any = await lib.getMetadata();
      const columns: string[] = Array.isArray(metadata?.variables)
        ? metadata.variables.map((v: any) => v?.name).filter(Boolean)
        : [];
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === block.id ? { ...b, status: "done", progress: 100, columns } : b
        )
      );
    } catch (err) {
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, status: "error", columns: [] } : b)));
    }
  };

  const handleDragOverBlock = (block: CanvasBlock, e: React.DragEvent) => {
    if (block.type !== "dataBlock") return;
    e.preventDefault();
    e.stopPropagation();
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, isDragOver: true } : b)));
  };

  const handleDragLeaveBlock = (block: CanvasBlock, e: React.DragEvent) => {
    if (block.type !== "dataBlock") return;
    e.preventDefault();
    e.stopPropagation();
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, isDragOver: false } : b)));
  };

  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    setPrompt("Compare fast food prevalence in the USA");
  }, [])

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-gray-100"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
    >
      {/* Infinite dotted background */}
      <div
        className="relative w-full h-full"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          cursor: isPanning ? "grabbing" : "grab",
        }}
      >

        <input
          className="absolute z-1 top-10 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 w-1/2 h-15 rounded-2xl shadow-lg bg-white border border-gray-200 cursor-auto"
          placeholder="What would you like to achieve?"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value) }
        >
        </input>
        {/* Movable content container */}
        <div
          className="relative w-full h-full"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
        >

         
          {blocks.map((block) => (
            <div
              key={block.id}
              data-block
              onMouseDown={(e) => handleBlockDrag(block.id, e)}
              onDragOver={(e) => handleDragOverBlock(block, e)}
              onDragLeave={(e) => handleDragLeaveBlock(block, e)}
              onDrop={(e) => handleFileDrop(block, e)}
              className={`absolute p-4 w-64 rounded-2xl shadow-lg border cursor-move z-10 ${
                block.isDragOver ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
              }`}
              style={{
                top: block.y,
                left: block.x,
              }}
            >
              <div className="font-semibold mb-2">{block.label}</div>
              {block.type === "dataBlock" ? (
                <>
                  {block.fileName ? (
                    <div className="text-sm text-gray-700 break-all">{block.fileName}</div>
                  ) : (
                    <div className="text-sm text-gray-500">Drop an .xpt file here</div>
                  )}
                  {block.status === "processing" && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                        <div className="bg-blue-500 h-2" style={{ width: `${block.progress ?? 0}%` }} />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{block.progress}%</div>
                    </div>
                  )}
                  {block.status === "done" && (
                    <div className="mt-3">
                      <div className="text-xs text-green-700 font-medium mb-1">Columns</div>
                      <div className="max-h-32 overflow-auto rounded border border-gray-200 p-2 bg-gray-50">
                        {(block.columns && block.columns.length > 0) ? (
                          <ul className="text-xs text-gray-800 space-y-1">
                            {block.columns.map((c) => (
                              <li key={c}>{c}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-gray-500">No columns found</div>
                        )}
                      </div>
                    </div>
                  )}
                  {block.status === "error" && (
                    <div className="mt-2 text-xs text-red-600">Unsupported file. Please drop an .xpt file.</div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">Drag to position</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// export function meta({}: Route.MetaArgs) {
//   return [
//     { title: "New React Router App" },
//     { name: "description", content: "Welcome to React Router!" },
//   ];
// }

// export default function Home() {
//   return <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
//   {/* Canvas with dotted background */}
//   <div
//     className="relative w-full h-full"
//     style={{
//       backgroundImage:
//         "radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px)",
//       backgroundSize: "20px 20px",
//     }}
//   >
//     {/* Example Block */}
//     <div className="absolute top-20 left-20 p-4 w-64 rounded-2xl shadow-lg bg-white border border-gray-200">
//       <h2 className="font-semibold text-lg mb-2">📂 Data Block</h2>
//       <p className="text-sm text-gray-600">Upload a file here</p>
//     </div>
//   </div>
// </div>;
// }
