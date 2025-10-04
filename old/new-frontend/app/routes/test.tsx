import type { Route
 } from "./+types/test";
 import { spawn } from "child_process";


export async function loader({ params }: Route.LoaderArgs) {
    const rScript = `
    required <- c("haven", "jsonlite", "dplyr", "ggplot2")
    to_install <- setdiff(required, rownames(installed.packages()))
    if (length(to_install)) install.packages(to_install, repos = "https://cloud.r-project.org")

    suppressPackageStartupMessages({
    library(haven)
    library(jsonlite)
    library(dplyr)
    })

    data <- read_xpt("uploads/1759461401567-DEMO_L.xpt")
    cat(toJSON(list(results = colnames(data))))
  `;

  console.log("🔷 Executing R Script:", rScript);

  const { spawn } = await import("child_process");
  return await new Promise((resolve) => {
    let result = "";
    let error = "";
    const child = spawn("Rscript", ["-e", rScript]);
    child.stdout.on("data", (data) => { 
      const chunk = data.toString();
      console.log("📤 R stdout:", chunk);
      result += chunk;
    });
    child.stderr.on("data", (data) => { 
      const chunk = data.toString();
      console.log("⚠️ R stderr:", chunk);
      error += chunk;
    });
    child.on("close", (code) => {
      console.log(`✅ R process closed with code: ${code}`);
      console.log("📊 Final result:", result);
      console.log("❌ Final error:", error);
      resolve({ result, error, code });
    });
  });
}
  