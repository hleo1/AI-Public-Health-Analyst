// index.ts
import express from "express";
import type { Request, Response } from "express";
import { spawn } from "child_process";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
//format of output: {"results": [array of column names]}
app.get("/", (req: Request, res: Response) => {
    // const { path } = req.body as { path?: string };

    // if (path) {

//   const filePath = path; // use provided path

  const filePath = "../data/DEMO_L.xpt"
  // R command to read .xpt and convert to JSON
  const rScript = `
    required <- c("haven", "jsonlite")
    to_install <- setdiff(required, rownames(installed.packages()))
    if (length(to_install)) install.packages(to_install, repos = "https://cloud.r-project.org")

    suppressPackageStartupMessages({
    library(haven)
    library(jsonlite)
    })

    data <- read_xpt("${filePath}")
    cat(toJSON(list(results = colnames(data))))
  `;

  // Spawn Rscript
  const child = spawn("Rscript", ["-e", rScript]);

  let result = "";
  let error = "";

  child.stdout.on("data", (data) => {
    result += data.toString();
  });

  child.stderr.on("data", (data) => {
    error += data.toString();
  });

  child.on("close", (code) => {
    if (code !== 0) {
      console.error("Rscript error:", error);
      res.status(500).send({ error: error || "Failed to read xpt file" });
    } else {
      try {
        const parsed = JSON.parse(result);
        res.json(parsed);
      } catch (e) {
        console.error("JSON parse error:", e);
        res.status(500).send({ error: "Invalid JSON from R" });
      }
    }
  });

// } else {
//     res.status(400).send("No path");
// }
});

// Ensure backend/data exists
const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dataDir),
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  const savedPath = (req as any).file?.path as string | undefined;
  if (!savedPath) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const rScript = `
    required <- c("haven", "jsonlite")
    to_install <- setdiff(required, rownames(installed.packages()))
    if (length(to_install)) install.packages(to_install, repos = "https://cloud.r-project.org")
    suppressPackageStartupMessages({ library(haven); library(jsonlite) })
    data <- read_xpt("${savedPath.replace(/\\/g, "\\\\")}")
    cat(toJSON(list(results = colnames(data))))
  `;

  const child = spawn("Rscript", ["-e", rScript]);
  let result = "";
  let error = "";

  child.stdout.on("data", (d) => (result += d.toString()));
  child.stderr.on("data", (d) => (error += d.toString()));
  child.on("close", (code) => {
    if (code !== 0) {
      console.error("Rscript error:", error);
      res.status(500).json({ error: error || "Failed to read xpt file" });
    } else {
      try {
        const parsed = JSON.parse(result);
        res.json(parsed);
      } catch (e) {
        console.error("JSON parse error:", e);
        res.status(500).json({ error: "Invalid JSON from R" });
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
