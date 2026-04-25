import { Router, Request, Response } from "express";
import { generateInterviewFeedback } from "../services/gemini";
import { sessions } from "./chat";

export const interviewRouter = Router();

// Store completed interview results
const results = new Map<string, object>();

// End interview and generate feedback
interviewRouter.post("/end", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.history.length < 2) {
      res.status(400).json({ error: "Not enough conversation to evaluate. Please have at least one exchange." });
      return;
    }

    const feedback = await generateInterviewFeedback(
      session.history,
      session.resumeText,
      session.jobDescription,
      session.persona,
      session.difficulty
    );

    const result = {
      sessionId,
      feedback,
      history: session.history,
      duration: Date.now() - session.startTime,
      persona: session.persona,
      difficulty: session.difficulty,
      completedAt: Date.now(),
    };

    results.set(sessionId, result);

    res.json(result);
  } catch (error) {
    console.error("Interview end error:", error);
    res.status(500).json({ error: "Failed to generate feedback" });
  }
});

// Get interview result
interviewRouter.get("/:id", (req: Request, res: Response) => {
  const result = results.get(req.params.id);
  if (!result) {
    res.status(404).json({ error: "Interview result not found" });
    return;
  }
  res.json(result);
});
