import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const resumeRouter = Router();

// In-memory resume store
const resumes = new Map<string, { text: string; filename: string; uploadedAt: number }>();

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Upload and parse resume
resumeRouter.post("/upload", upload.single("resume"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No PDF file provided" });
      return;
    }

    // Dynamic import for pdf-parse (CommonJS module)
    const pdfParse = require("pdf-parse");
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text || "";

    if (!text.trim()) {
      res.status(400).json({ error: "Could not extract text from PDF" });
      return;
    }

    const resumeId = uuidv4();
    resumes.set(resumeId, {
      text,
      filename: req.file.originalname,
      uploadedAt: Date.now(),
    });

    res.json({
      resumeId,
      filename: req.file.originalname,
      textLength: text.length,
      preview: text.substring(0, 300) + "...",
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

// Get resume text by ID
resumeRouter.get("/:id", (req: Request, res: Response) => {
  const resume = resumes.get(req.params.id);
  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  res.json({ text: resume.text, filename: resume.filename });
});

export { resumes };
