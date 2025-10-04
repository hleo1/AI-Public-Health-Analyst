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
    <div className="max-w-4xl mx-auto p-8">
      <Form
        method="post"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-8 mb-8"
      >
        <h2 className="text-3xl font-bold mb-8 text-gray-800">
          Upload Data Files
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block mb-3">
              <span className="text-xl font-semibold text-gray-700">
                XPT File:
              </span>
              <input
                type="file"
                name="xpt"
                className="block mt-3 w-full text-lg text-gray-700
              border-2 border-dashed border-gray-300 rounded-xl p-4
              transition-all duration-200 hover:border-blue-400
              file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 
              file:text-base file:font-semibold file:bg-blue-600 file:text-white 
              hover:file:bg-blue-700 file:cursor-pointer"
                onChange={(e) => handleXptChange(e)}
              />
            </label>
          </div>

          <div>
            <label className="block mb-3">
              <span className="text-xl font-semibold text-gray-700">
                Documentation File:
              </span>
              <input
                type="file"
                name="pdf"
                className="block mt-3 w-full text-lg text-gray-700
              border-2 border-dashed border-gray-300 rounded-xl p-4
              transition-all duration-200 hover:border-blue-400
              file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 
              file:text-base file:font-semibold file:bg-blue-600 file:text-white 
              hover:file:bg-blue-700 file:cursor-pointer"
                onChange={(e) => handlePdfChange(e)}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold py-4 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Process Files
        </button>
      </Form>

      {hasData && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Extracted Variables
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-6 py-4 text-left text-lg font-semibold text-gray-700">
                    Variable Name
                  </th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-lg font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-lg font-semibold text-gray-700">
                    Units
                  </th>
                </tr>
              </thead>
              <tbody>
                {parsed_var_names.map((name, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-300 px-6 py-4 text-base text-gray-800 font-medium">
                      {name}
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-base text-gray-700">
                      {parsed_description?.[i] || ""}
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-base text-gray-700">
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

function NodesPanel({ onClose }: { onClose: () => void }) {
  const categories = [
    {
      name: "Core Nodes",
      icon: "📦",
      description: "Essential components for workflow construction",
    },
    {
      name: "Using AI",
      icon: "🤖",
      description: "Leverage AI for various tasks",
    },
    {
      name: "Triggers",
      icon: "🎯",
      description: "Automate actions based on events",
    },
    {
      name: "Your Custom Nodes",
      icon: "⚙️",
      description: "Create your own nodes to automate your workflows",
    },
    {
      name: "Subflows",
      icon: "🔗",
      description: "Automate your workflows with subflows",
    },
  ];

  const frequentlyUsed = [
    { name: "Ask AI", icon: "💬", description: "Prompt an AI..." },
    { name: "Input", icon: "⬇️", description: "Entry point for..." },
    { name: "Extract Data", icon: "📤", description: "Extract key piece..." },
    { name: "Output", icon: "⬆️", description: "Exit point for..." },
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
          {categories.map((category, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-2xl">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600">›</span>
              </div>
            </div>
          ))}
        </div>

        {/* Frequently Used */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Used
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {frequentlyUsed.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-150 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl mb-2 shadow-sm">
                  {item.icon}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="w-full min-h-screen flex items-start justify-start p-4">
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="cursor-pointer relative w-16 h-16 rounded-full bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 shadow-lg flex items-center justify-center text-white text-2xl transition-colors"
        >
          <span className="absolute top-0 left-0 w-full h-1 rounded-t-full bg-white/30 blur-sm"></span>
          +
        </button>
      )}

      {isPanelOpen && <NodesPanel onClose={() => setIsPanelOpen(false)} />}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <div
        className="w-full min-h-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.2) 1.5px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >

        <AddButton/>
        
        {/* <DragNDropInput /> */}
      </div>
    </>
  );
}
