import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat";
import { resumeRouter } from "./routes/resume";
import { interviewRouter } from "./routes/interview";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/interview", interviewRouter);

app.listen(PORT, () => {
  console.log(`AI Interview Pro backend running on port ${PORT}`);
});
