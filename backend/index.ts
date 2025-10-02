// index.ts
import express from "express";
import type { Request, Response } from "express";
import { spawn } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
//format of output: {"results": [array of column names]}
app.post("/", (req: Request, res: Response) => {
    const { path } = req.body;

    if (path) {

    
  const filePath = "../data/DEMO_L.xpt"; // <-- update with your .xpt file

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

} else {
    res.send(400).send("No path")
}
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
