import type { Route } from "./+types/home";
import { useEffect, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";


function Icon({ text }: { text: string }) {
  return (
    <div className="w-15 h-15 border border-black rounded-xl flex items-center justify-center text-center cursor-pointer">
      {text}
    </div>
  );
}

function DragNDrop({file, setFile, filetype} : {file: File | null, setFile: React.Dispatch<React.SetStateAction<File| null>>, filetype: string}) {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="border border-black">
      <input {...getInputProps()} />
      {!file?.name ? <p>Drag 'n' drop {filetype}</p> : <p>{file?.name}</p>}
    </div>
  );
}

function DataSourceBlock() {
  const [xptFile, setxptFile] = useState<File | null>(null);
  const [pdfFile, setpdfFile] = useState<File | null>(null);
  const [uploadSuccesful, setuploadSuccesful] = useState(false);

  const uploadFiles = async () => {
    if (!xptFile || !pdfFile) {
      alert("Both XPT and PDF files are required.");
      return;
    }
    const formData = new FormData();
    formData.append("xpt", xptFile);
    formData.append("pdf", pdfFile);

    try {
      const response = await fetch("http://localhost:3000/data-source", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      console.log("Upload success:", text);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  }

  return (
    <div className="w-60 h-30 top-20 bg-white rounded-xl border border-black text-center flex flex-col items-center justify-center">
      Data Source
      <DragNDrop file={xptFile} setFile={setxptFile} filetype=".xpt"/>
      <DragNDrop file={pdfFile} setFile={setpdfFile} filetype=".pdf"/>
      <button className="bg-blue-300" onClick={() => {uploadFiles()}}>Upload</button>
    </div>
  );
}

function FindBlock() {
  return (
    <div className="w-60 h-30 top-20 bg-white rounded-xl border border-black text-center flex items-center justify-center">
      Find Block
    </div>
  );
}

function ExtractInfoBlock() {
  return (
    <div className="w-60 h-30 top-20 bg-white rounded-xl border border-black text-center flex items-center justify-center">
      Extract Info
    </div>
  );
}

function SelectBlock() {
  return (
    <div className="w-60 h-30 top-20 bg-white rounded-xl border border-black text-center flex items-center justify-center">
      Select
    </div>
  );
}

function SideBar() {
  return (
    <div className="absolute left-2 top-1/2 -translate-y-1/2 h-100 w-20 bg-white rounded-xl border border-black  gap-3 py-10 shadow-xl flex flex-col items-center text-sm">
      <Icon text="Data Source"></Icon>
      <Icon text="Get Columns"></Icon>
      <Icon text="Extract Info"></Icon>
      <Icon text="Select"></Icon>
    </div>
  );
}

export default function Home() {
  return (
    <div
      className="w-full min-h-screen"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,0.2) 1.5px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="flex gap-5">
        <DataSourceBlock />
        <FindBlock />
        <ExtractInfoBlock />
        <SelectBlock />
      </div>
      <SideBar />
    </div>
  );
}
