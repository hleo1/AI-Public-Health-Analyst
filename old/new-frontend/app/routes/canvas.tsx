import type { Route } from "./+types/canvas";
import { useEffect, useCallback, useState } from "react";
import { useFetcher } from "react-router-dom";
import SideBar from "~/components/SideBar";

import { DataSourceBlock } from "~/components/DataSourceBlock";
import { spawn } from "child_process";



export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const xpt = formData.get("xpt");
  const pdf = formData.get("pdf");

  if (!(xpt instanceof File) || !(pdf instanceof File)) {
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

  const xptPath = await saveFile(xpt);
  const pdfPath = await saveFile(pdf);

  const rScript = `
    required <- c("haven", "jsonlite", "dplyr", "ggplot2")
    to_install <- setdiff(required, rownames(installed.packages()))
    if (length(to_install)) install.packages(to_install, repos = "https://cloud.r-project.org")

    suppressPackageStartupMessages({
    library(haven)
    library(jsonlite)
    library(dplyr)
    })

    data <- read_xpt("${xptPath}")
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
      if (code !== 0) {
        resolve({ error: error || "Failed to read xpt file" });
      } else {
        try {
          const parsed = JSON.parse(result);
          resolve({ xptPath, pdfPath, parsed });
        } catch (e) {
          resolve({ error: "Invalid JSON from R" });
        }
      }
    });
  });
}


export default function Canvas({
  actionData,
}: Route.ComponentProps) {
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
      </div>
      <SideBar />
    </div>
  );
}
