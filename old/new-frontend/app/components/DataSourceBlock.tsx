
import { useFetcher } from 'react-router-dom';
import { Block } from './Block';

import { useEffect, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

type ActionData = {
    xptPath: string;
    pdfPath: string;
  };


function DragNDrop({file, setFile, filetype, name} : {file: File | null, setFile: React.Dispatch<React.SetStateAction<File| null>>, filetype: string, name: string}) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      console.log('File dropped:', acceptedFiles[0]);
    }
  }, [setFile]);

  const acceptTypes = filetype === '.pdf' 
    ? { 'application/pdf': ['.pdf'] } as const
    : { 'application/octet-stream': ['.xpt'] } as const;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptTypes as any,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded p-4 w-full text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} name={name} type="file"/>
      {file ? (
        <p className="text-sm text-green-600">✓ {file.name}</p>
      ) : (
        <p className="text-sm text-gray-600">
          {isDragActive ? `Drop ${filetype} file here` : `Drag & drop ${filetype} file or click to select`}
        </p>
      )}
    </div>
  );
}

function MyDropzone() {
  const [filepath, setFilePath] = useState("");

  const onDrop = useCallback(acceptedFiles => {
    // Do something with the files

    setFilePath(acceptedFiles[0]?.path)
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }

      {filepath && <div>{filepath} </div>}
    </div>
  )
}



export function DataSourceBlock() {
  const [xptFile, setXptFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fetcher = useFetcher<ActionData>();
  const isUploading = fetcher.state === 'submitting';

  return (
    <Block title="Data Source">
      <fetcher.Form method="post" encType="multipart/form-data" className="flex flex-col items-center gap-2 w-full">
        {/* <DragNDrop file={xptFile} setFile={setXptFile} filetype=".xpt" name="xpt" />
        <DragNDrop file={pdfFile} setFile={setPdfFile} filetype=".pdf" name="pdf" /> */}
        <MyDropzone/>
        <button
          type="submit"
          className="bg-blue-300 w-full rounded p-1"
          disabled={isUploading || !xptFile || !pdfFile}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </fetcher.Form>

      {fetcher.data && (
        <div className="mt-2 text-xs p-2 border-t text-left w-full">
          <p><strong>Success!</strong> File paths received.</p>
        </div>
      )}
    </Block>
  );
}