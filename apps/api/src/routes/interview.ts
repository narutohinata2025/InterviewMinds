import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface InterviewRecord {
  id: string;
  resumeId: string;
  messages: { role: string; text: string }[];
  score: number;
  feedback: string;
  metrics: { subject: string; A: number; fullMark: number }[];
  strengths: string[];
  improvements: string[];
  createdAt: Date;
}

const interviewStore = new Map<string, InterviewRecord>();

router.post("/end", async (req: express.Request, res: express.Response) => {
  try {
    const { resumeId, history } = req.body;

    if (!history || history.length === 0) {
      return res.status(400).json({ error: "No conversation to analyze" });
    }

    const userMessageCount = history.filter(
      (msg: { role: string }) => msg.role === "user",
    ).length;

    const emptyMetrics = [
      { subject: "Technical Knowledge", A: 0, fullMark: 100 },
      { subject: "Communication Skills", A: 0, fullMark: 100 },
      { subject: "Problem Solving", A: 0, fullMark: 100 },
      { subject: "Code Quality", A: 0, fullMark: 100 },
      { subject: "Job Fit", A: 0, fullMark: 100 },
    ];

    if (userMessageCount === 0) {
      const id = uuidv4();
      const record: InterviewRecord = {
        id,
        resumeId,
        messages: history,
        score: 0,
        feedback: "Interview terminated early. No answers were provided.",
        metrics: emptyMetrics,
        strengths: [],
        improvements: ["Complete the interview to receive feedback"],
        createdAt: new Date(),
      };
      interviewStore.set(id, record);
      return res.json({ id, score: 0, metrics: emptyMetrics });
    }

    const systemPrompt = `
You are an expert Technical Interview Evaluator.
Analyze the provided interview transcript based ONLY on the candidate's answers.

--- SCORING CRITERIA (WEIGHTED) ---
1. **Technical Knowledge (30%)**: Accuracy of technical answers, understanding of concepts.
2. **Communication Skills (20%)**: Clarity, articulation, and structured responses.
3. **Problem Solving (25%)**: Approach to problems, debugging, and logical thinking.
4. **Code Quality (15%)**: If coding was involved - correctness, efficiency, and clean code.
5. **Job Fit (10%)**: Alignment with role requirements and cultural fit indicators.

--- OUTPUT REQUIREMENTS ---
Return ONLY a valid JSON object with this exact structure:
{
  "score": number (0-100, weighted average),
  "feedback": "string (2-3 paragraph detailed summary of performance)",
  "skills": [
    { "subject": "Technical Knowledge", "A": number (0-100), "fullMark": 100 },
    { "subject": "Communication Skills", "A": number (0-100), "fullMark": 100 },
    { "subject": "Problem Solving", "A": number (0-100), "fullMark": 100 },
    { "subject": "Code Quality", "A": number (0-100), "fullMark": 100 },
    { "subject": "Job Fit", "A": number (0-100), "fullMark": 100 }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"]
}
`;

    const conversationText = history
      .map((msg: { role: string; text: string }) => `${msg.role}: ${msg.text}`)
      .join("\n");

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: conversationText },
    ]);

    const aiResponse = JSON.parse(result.response.text() || "{}");

    const finalData = {
      score: aiResponse.score || 0,
      feedback: aiResponse.feedback || "Analysis could not be completed.",
      metrics: aiResponse.skills || emptyMetrics,
      strengths: aiResponse.strengths || [],
      improvements: aiResponse.improvements || [],
    };

    const id = uuidv4();
    const record: InterviewRecord = {
      id,
      resumeId: resumeId || "",
      messages: history,
      score: finalData.score,
      feedback: finalData.feedback,
      metrics: finalData.metrics,
      strengths: finalData.strengths,
      improvements: finalData.improvements,
      createdAt: new Date(),
    };

    interviewStore.set(id, record);

    res.json({
      id,
      score: finalData.score,
      feedback: finalData.feedback,
      metrics: finalData.metrics,
      strengths: finalData.strengths,
      improvements: finalData.improvements,
    });
  } catch (error: unknown) {
    console.error("Interview end error:", (error as Error).message);
    res.status(500).json({
      error: "Failed to analyze interview",
      details: (error as Error).message,
    });
  }
});

router.get("/:id", (req: express.Request, res: express.Response) => {
  const record = interviewStore.get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Interview not found" });
  }
  res.json(record);
});

export default router;
