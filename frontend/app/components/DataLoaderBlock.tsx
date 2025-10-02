import React, { useCallback, useState } from "react";

type Props = {
  className?: string;
};

export function DataLoaderBlock({ className = "absolute top-20 left-20" }: Props) {
  const [path, setPath] = useState("");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[] | null>(null);

  const uploadAndParse = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err: any) {
      setError(err?.message || "Failed to read file");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setResults(null);

    const file = e.dataTransfer.files?.[0] || null;
    if (!file) {
      setError("No file dropped");
      return;
    }
    setFileObj(file);
    setPath(file.name);
    await uploadAndParse(file);
  }, [uploadAndParse]);

  const onFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFileObj(f);
    setPath(f?.name || "");
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const readFile = useCallback(async () => {
    if (!fileObj) return;
    await uploadAndParse(fileObj);
  }, [fileObj, uploadAndParse]);

  return (
    <div
      className={`${className} p-4 w-[320px] rounded-2xl shadow-lg bg-white border border-gray-200`}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <h2 className="font-semibold text-lg mb-2">📂 Data Loader</h2>
      <p className="text-sm text-gray-600 mb-3">Drag and drop a file here</p>

      <div className="text-xs text-gray-700 mb-2 break-words">
        <span className="font-medium">Path:</span> {path || "(none)"}
      </div>

      <input
        className="w-full mb-3 px-2 py-1 border rounded text-sm"
        placeholder="Or paste absolute path here"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />

      <div className="mb-3">
        <input type="file" onChange={onFilePick} />
      </div>

      <button
        className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-60"
        onClick={readFile}
        disabled={!fileObj || loading}
      >
        {loading ? "Reading..." : "Read file"}
      </button>

      {error && (
        <div className="mt-3 text-xs text-red-600">{error}</div>
      )}

      {results && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-700 mb-1">Columns</div>
          <ul className="max-h-40 overflow-auto text-sm list-disc list-inside space-y-1">
            {results.map((r, i) => (
              <li key={`${r}-${i}`}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


