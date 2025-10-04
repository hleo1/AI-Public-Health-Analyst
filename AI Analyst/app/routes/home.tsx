import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Form, useSubmit, useFetcher } from "react-router";
import { useActionData } from "react-router";
import { spawn } from "child_process";

import fs from "fs";

import { Extractor } from "./extract";

async function formDataParsing(request: Request) {
  let formData = await request.formData();
  let xptFile = formData.get("xpt");
  let pdfFile = formData.get("pdf");

  if (!(xptFile instanceof File) || !(pdfFile instanceof File)) {
    return { error: "Both xpt and pdf are required." };
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  const uploadDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const saveFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);
    return filepath;
  };

  const xptPath = await saveFile(xptFile);
  const pdfPath = await saveFile(pdfFile);

  return {
    xptPath,
    pdfPath,
  };
}

async function extractXPT(path: string) {
  const rScript = `
  required <- c("haven", "jsonlite", "dplyr", "ggplot2")
  to_install <- setdiff(required, rownames(installed.packages()))
  if (length(to_install)) install.packages(to_install, repos = "https://cloud.r-project.org")

  suppressPackageStartupMessages({
  library(haven)
  library(jsonlite)
  library(dplyr)
  })

  data <- read_xpt("${path}")
  cat(toJSON(list(results = colnames(data))))
`;

  return await new Promise((resolve) => {
    let result = "";
    let error = "";
    const child = spawn("Rscript", ["-e", rScript]);
    child.stdout.on("data", (data) => {
      const chunk = data.toString();
      result += chunk;
    });
    child.stderr.on("data", (data) => {
      const chunk = data.toString();
      error += chunk;
    });
    child.on("close", (code) => {
      console.log({ result, error, code });
      resolve({ result, error, code });
    });
  });
}

export async function action({ request }: Route.ActionArgs) {
  const { xptPath, pdfPath } = await formDataParsing(request);
  if (xptPath) {
    let data = await extractXPT(xptPath);
    const parsed = data?.result ? JSON.parse(data.result) : null;
    const columns = parsed?.results as string[];

    // read the contents of pdfPath (it's actually a .txt) into a string
    let documentation = "";
    if (pdfPath) {
      documentation = await fs.promises.readFile(pdfPath, "utf8");
    }

    console.log("done doucmetnation");

    let result = await Extractor(columns, documentation);
    return result;
  } else {
    return { error: "xptPath broken" };
  }
}

export function useFileUpload() {
  const [xptFile, setXptFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleXptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setXptFile(e.target.files?.[0] || null);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfFile(e.target.files?.[0] || null);
  };

  return {
    xptFile,
    pdfFile,
    handleXptChange,
    handlePdfChange,
  };
}

export function useExtractedData() {
  const data = useActionData<typeof action>();

  return {
    parsed_var_names: (data?.var_names as string[]) || [],
    parsed_description: (data?.description as string[]) || [],
    parsed_units: (data?.possible_values_and_description as string[]) || [],
    hasData: data?.var_names && (data.var_names as string[]).length > 0,
  };
}

export function useFormSubmit() {
  const submit = useSubmit();

  const submitFiles = (xptFile: File | null, pdfFile: File | null) => {
    const formData = new FormData();
    if (xptFile) formData.append("xpt", xptFile);
    if (pdfFile) formData.append("pdf", pdfFile);

    submit(formData, { method: "post", encType: "multipart/form-data" });
  };

  return { submitFiles };
}

function DragNDropInput() {
  const { xptFile, pdfFile, handleXptChange, handlePdfChange } =
    useFileUpload();

  const { parsed_var_names, parsed_description, parsed_units, hasData } =
    useExtractedData();

  const { submitFiles } = useFormSubmit();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // 3. Prevent the default form submission which would be empty
    event.preventDefault();

    submitFiles(xptFile, pdfFile);
  };

  return (
    <div className="w-[420px]">
      <Form
        method="post"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl p-6 mb-6 border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center text-xl shadow-md">
            📦
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Load Data
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">
                XPT File
              </span>
              <input
                type="file"
                name="xpt"
                className="block w-full text-sm text-gray-700
              border-2 border-gray-200 rounded-xl p-3
              transition-all duration-200 hover:border-blue-400 hover:bg-gray-50
              file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 
              file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white 
              hover:file:from-blue-400 hover:file:to-blue-500 file:cursor-pointer file:shadow-sm"
                onChange={(e) => handleXptChange(e)}
              />
            </label>
          </div>

          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">
                Documentation File
              </span>
              <input
                type="file"
                name="pdf"
                className="block w-full text-sm text-gray-700
              border-2 border-gray-200 rounded-xl p-3
              transition-all duration-200 hover:border-blue-400 hover:bg-gray-50
              file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 
              file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white 
              hover:file:from-blue-400 hover:file:to-blue-500 file:cursor-pointer file:shadow-sm"
                onChange={(e) => handlePdfChange(e)}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-sm font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Process Files
        </button>
      </Form>

      {hasData && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold mb-4 text-gray-900">
            Extracted Variables
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 rounded-tl-lg">
                    Variable
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 rounded-tr-lg">
                    Units
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsed_var_names.map((name, i) => (
                  <tr key={i} className="hover:bg-blue-50 transition-colors group">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {parsed_description?.[i] || ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {parsed_units?.[i] || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function NodesPanel({ 
  onClose, 
  selectedItem, 
  setSelectedItem 
}: { 
  onClose: () => void;
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
}) {

  const categories = [
    {
      name: "Load Data",
      icon: "📦",
      description: "Load Dataframe",
    },
    {
      name: "Data Visualization",
      icon: "📊",
      description: "Bar Charts, Line Graphs, More",
    },
    {
      name: "Using AI",
      icon: "🧠",
      description: "Leverage AI for various tasks",
    },
    {
      name: "Custom Nodes",
      icon: "🛠️",
      description: "Run custom scripts in R",
    },
    {
      name: "Post Processing",
      icon: "🧮",
      description: "Bonferonni/FDR P Value Correction",
    }
  ];

  const frequentlyUsed = [
    { name: "Survival Analysis", icon: "⏳", description: "Kaplan-Meier, Cox models" },
    { name: "Linear Regression", icon: "📈", description: "Fit and interpret linear models" },
    { name: "Logistic Regression", icon: "🔢", description: "Classify outcomes with logistic models" },
    { name: "Lasso Regression", icon: "🪢", description: "Regularized regression for feature selection" },
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-[480px] bg-white shadow-2xl z-50 animate-slide-in overflow-y-auto">
      <div className="p-6">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search all nodes"
              className="text-lg text-gray-600 bg-transparent border-none outline-none w-64"
            />
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-2 mb-8">
          {categories.map((category, idx) => {
            const isSelected = selectedItem === category.name;
            return (
              <div
                key={idx}
                onClick={() => setSelectedItem(category.name)}
                className={`p-4 rounded-xl cursor-pointer transition-all group ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                        isSelected
                          ? "bg-white/20"
                          : "bg-gradient-to-br from-gray-100 to-gray-200"
                      }`}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${
                          isSelected ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {category.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          isSelected ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`${
                      isSelected
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  >
                    ›
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analysis Tools */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Analysis Tools
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {frequentlyUsed.map((item, idx) => {
              const isSelected = selectedItem === item.name;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedItem(item.name)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg scale-105"
                      : "bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-150"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-2 shadow-sm ${
                      isSelected ? "bg-white/30" : "bg-white"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <h4
                    className={`font-semibold text-sm mb-1 ${
                      isSelected ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.name}
                  </h4>
                  <p
                    className={`text-xs ${
                      isSelected ? "text-purple-100" : "text-gray-600"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableNode({ 
  id, 
  initialX, 
  initialY,
  onDelete,
  children 
}: { 
  id: string;
  initialX: number;
  initialY: number;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, button, label, .delete-button')) {
      return;
    }
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 10,
      }}
      onMouseDown={handleMouseDown}
      className="relative"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="delete-button absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors z-50 cursor-pointer text-sm"
      >
        ✕
      </button>
      {children}
    </div>
  );
}

function AddButton({ 
  selectedItem, 
  setSelectedItem 
}: { 
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
}) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <>
      <div className="absolute top-0 left-0 p-4 z-40">
        {!isPanelOpen && (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="cursor-pointer relative w-16 h-16 rounded-full bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 shadow-lg flex items-center justify-center text-white text-2xl transition-colors"
          >
            <span className="absolute top-0 left-0 w-full h-1 rounded-t-full bg-white/30 blur-sm"></span>
            +
          </button>
        )}
      </div>

      {isPanelOpen && (
        <NodesPanel 
          onClose={() => setIsPanelOpen(false)} 
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
      )}
    </>
  );
}

export default function Home() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [dataNodes, setDataNodes] = useState<Array<{ id: string; x: number; y: number }>>([]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if click is on the canvas (not on a node or panel)
    if ((e.target as HTMLElement).closest('.data-node, .fixed')) {
      return;
    }

    if (selectedItem === "Load Data") {
      const newNode = {
        id: `node-${Date.now()}`,
        x: e.clientX - 200, // Center the node at click position
        y: e.clientY - 200,
      };
      setDataNodes([...dataNodes, newNode]);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    setDataNodes(dataNodes.filter(node => node.id !== nodeId));
  };

  return (
    <>
      <div
        className="w-full min-h-screen relative"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.2) 1.5px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        onClick={handleCanvasClick}
      >
        <AddButton selectedItem={selectedItem} setSelectedItem={setSelectedItem} />

        {dataNodes.map((node) => (
          <DraggableNode 
            key={node.id} 
            id={node.id} 
            initialX={node.x} 
            initialY={node.y}
            onDelete={() => handleDeleteNode(node.id)}
          >
            <div className="data-node">
              <DragNDropInput />
            </div>
          </DraggableNode>
        ))}
      </div>
    </>
  );
}
