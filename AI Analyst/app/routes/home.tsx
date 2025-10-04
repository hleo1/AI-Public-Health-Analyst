import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

import React, {useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import { Form, useSubmit, useFetcher } from "react-router";
import { useActionData } from 'react-router';
import { spawn } from "child_process";

import fs from "fs";

import { Extractor } from "./extract";


export async function formDataParsing(request: Request)  {

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
    pdfPath
  }

}

export async function extractXPT(path: string) {
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
    console.log({ result, error, code })
    resolve({ result, error, code });
  });
});
}


export async function action({
  request,
}: Route.ActionArgs) {
  const {xptPath, pdfPath} = await formDataParsing(request);
  if (xptPath) {
    let data = await extractXPT(xptPath)
    const parsed = data?.result ? JSON.parse(data.result) : null;
    const columns = parsed?.results as string[]; 

    // read the contents of pdfPath (it's actually a .txt) into a string
    let documentation = "";
    if (pdfPath) {
      documentation = await fs.promises.readFile(pdfPath, "utf8");
    }

    console.log("done doucmetnation")

    let result = await Extractor(columns, documentation);
    return result
  } else { 
    return {error: "xptPath broken"}
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
    handlePdfChange
  }
}


export function useExtractedData() { 
  const data = useActionData<typeof action>();

  return { 
    parsed_var_names: (data?.var_names as string[]) || [],
    parsed_description: (data?.description as string[]) || [],
    parsed_units: (data?.possible_values_and_description as string[]) || [],
    hasData: data?.var_names && (data.var_names as string[]).length > 0,
  }

}


export function useFormSubmit() {
  const submit = useSubmit();

  const submitFiles = (xptFile: File | null, pdfFile: File | null) => { 
    const formData = new FormData();
    if (xptFile) formData.append("xpt", xptFile);
    if (pdfFile) formData.append("pdf", pdfFile);

    submit(formData, { method: "post", encType: "multipart/form-data" });
  }

  return {submitFiles}
}

function DragNDropInput({ name, handleChange }: { name: string, handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return(<div>
        <label className="block mb-3">
          <span className="text-md font-semibold text-gray-700">{name}</span>
          <input
            type="file"
            name="xpt"
            className="block mt-3 w-full text-md text-gray-700
              border-2 border-dashed border-gray-300 rounded-xl p-4
              transition-all duration-200 hover:border-blue-400
              file:mr-4 file:py-1 file:px-2 file:rounded-lg file:border-0 
              file:text-base file:font-semibold file:bg-blue-600 file:text-white 
              hover:file:bg-blue-700 file:cursor-pointer"
            onChange={e => handleChange(e)}
          />
        </label>
      </div>)

}


export function FileSelectAndExtract() {

  const { xptFile, pdfFile, handleXptChange, handlePdfChange} = useFileUpload();
  const { submitFiles } = useFormSubmit();
  const { parsed_var_names, parsed_description, parsed_units, hasData} = useExtractedData();


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitFiles(xptFile, pdfFile);
  };

  

  return (<div className="w-75">
    <Form method="post" encType="multipart/form-data" onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-xl font-bold mb-2 text-gray-800">Upload Data Files</h2>
      
      <div className="space-y-2">
        <DragNDropInput name = "XPT File" handleChange = {handleXptChange} />
        <DragNDropInput name = "PDF File" handleChange = {handlePdfChange}/>
      </div>
      
      <button 
        type="submit" 
        className="mt-1 w-full bg-blue-600 hover:bg-blue-700 text-white text-md font-semibold py-1 px-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        Process Files
      </button>
    </Form>
  
  {hasData && (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Extracted Variables</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-6 py-4 text-left text-lg font-semibold text-gray-700">Variable Name</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-lg font-semibold text-gray-700">Description</th>
              <th className="border border-gray-300 px-6 py-4 text-left text-lg font-semibold text-gray-700">Units</th>
            </tr>
          </thead>
          <tbody>
            {parsed_var_names.map((name, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="border border-gray-300 px-6 py-4 text-base text-gray-800 font-medium">{name}</td>
                <td className="border border-gray-300 px-6 py-4 text-base text-gray-700">{parsed_description?.[i] || ""}</td>
                <td className="border border-gray-300 px-6 py-4 text-base text-gray-700">{parsed_units?.[i] || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
  
    </div>)
}




export default function Home() {
  return (<FileSelectAndExtract/>)
}
