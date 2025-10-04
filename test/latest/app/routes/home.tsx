import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

import React, {useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'


type DropzoneType = {
  file: File | null,
  setFile: React.Dispatch<React.SetStateAction<File|null>>
}

function MyDropzone({file, setFile} : DropzoneType) {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0])
  }, [setFile])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div {...getRootProps()}
    className = {`border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer transition-colors${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />

      {
        file ? (
          <p className="text-sm text-blue-500">{file?.path}</p>
        ) : (
          <p className = "text-sm text-gray-600">
            {isDragActive ? `Drag file here` : `Drag & Drop or Click`}
          </p>
        )
      }
    </div>
  )
}



export default function Home() {

  const [xptFile, setXptFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  return <><MyDropzone file = {xptFile} setFile = {setXptFile} /> 
  <MyDropzone file = {pdfFile} setFile = {setPdfFile}/></>;
}
