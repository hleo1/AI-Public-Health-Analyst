import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import {dirname} from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(express.json())
app.use(cors())


const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  });

const upload = multer({ storage });

app.post("/data-source", upload.fields([
    { name: "xpt", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]), (req, res) => {
    const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      const xpt = files?.xpt?.[0];
      const pdf = files?.pdf?.[0];

      if (!xpt || !pdf) {
        return res.status(400).send("Both xpt and pdf are required.");
      }
        res.send("Files uploaded succesfully");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});