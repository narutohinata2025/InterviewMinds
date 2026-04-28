import { Router, Request, Response } from "express";
import { generateChatResponse, ChatMessage } from "../services/groq";

export const chatRouter = Router();

// In-memory session store for production scalability
const sessions = new Map<
  string,
  {
    resumeText: string;
    jobDescription: string;
    history: ChatMessage[];
    persona: string;
    difficulty: string;
    startTime: number;
    processing: boolean;
  }
>();

// Initialize a new interview session
chatRouter.post("/init", (req: Request, res: Response) => {
  const { sessionId, resumeText, jobDescription, persona, difficulty } = req.body;

  if (!sessionId || !resumeText) {
    res.status(400).json({ error: "sessionId and resumeText are required" });
    return;
  }

  sessions.set(sessionId, {
    resumeText: resumeText || "",
    jobDescription: jobDescription || "General software engineering position",
    history: [],
    persona: persona || "friendly",
    difficulty: difficulty || "mid",
    startTime: Date.now(),
    processing: false,
  });

  res.json({ success: true, sessionId });
});

// Send a message and get AI response
chatRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      res.status(400).json({ error: "sessionId and message are required" });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found. Please start a new interview." });
      return;
    }

    if (session.processing) {
      res.status(429).json({ error: "Session is currently processing a message. Please wait." });
      return;
    }

    session.processing = true;

    const reply = await generateChatResponse(
      message,
      session.resumeText,
      session.jobDescription,
      session.history,
      session.persona,
      session.difficulty
    );

    // Update history
    session.history.push({ role: "user", content: message });
    session.history.push({ role: "assistant", content: reply });
    session.processing = false;

    res.json({ reply, messageCount: session.history.length });
  } catch (error) {
    const session = sessions.get(req.body.sessionId);
    if (session) session.processing = false;
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// Get session history
chatRouter.get("/history/:sessionId", (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ history: session.history });
});

// Cleanup old sessions (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 2 * 60 * 60 * 1000; // 2 hours
  for (const [id, session] of sessions) {
    if (now - session.startTime > MAX_AGE) {
      sessions.delete(id);
    }
  }
}, 30 * 60 * 1000);

export { sessions };
