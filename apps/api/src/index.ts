import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat";
import interviewRoutes from "./routes/interview";
import compilerRoutes from "./routes/compiler";
import resumeRoutes from "./routes/resume";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

app.get("/ping", (_req: Request, res: Response) => {
  res.send("pong");
});

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "InterviewMinds Backend is Running!" });
});

app.use("/api/resume", resumeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/compiler", compilerRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
