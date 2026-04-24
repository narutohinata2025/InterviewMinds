import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

interface ResumeRecord {
  id: string;
  fileName: string;
  content: string;
  jobDescription: string;
  uploadedAt: Date;
}

const resumeStore = new Map<string, ResumeRecord>();

router.post(
  "/upload",
  upload.single("resume"),
  async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const jobDescription = req.body.jobDescription || "";

      const pdfData = await pdfParse(req.file.buffer);
      const cleanText = pdfData.text
        .replace(/\s+/g, " ")
        .replace(/----------------/g, " ")
        .trim();

      if (!cleanText || cleanText.length < 30) {
        return res
          .status(400)
          .json({ error: "Could not extract text from PDF. Please try another file." });
      }

      const id = uuidv4();
      const record: ResumeRecord = {
        id,
        fileName: req.file.originalname,
        content: cleanText,
        jobDescription,
        uploadedAt: new Date(),
      };

      resumeStore.set(id, record);

      res.json({
        message: "Resume processed successfully!",
        id,
        previewText: cleanText.substring(0, 200) + "...",
        jobDescription: jobDescription.substring(0, 200),
      });
    } catch (error: unknown) {
      console.error("Resume processing error:", (error as Error).message);
      res.status(500).json({
        error: "Failed to process resume",
        details: (error as Error).message,
      });
    }
  },
);

router.get("/:id", (req: express.Request, res: express.Response) => {
  const record = resumeStore.get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Resume not found" });
  }
  res.json(record);
});

export { resumeStore };
export default router;
