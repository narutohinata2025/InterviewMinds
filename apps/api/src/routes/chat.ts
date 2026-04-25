import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { resumeStore } from "./resume";

dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface Persona {
  name: string;
  role: string;
  style: string;
  tone: string;
  gender: "male" | "female";
}

const PERSONAS: Record<string, Persona> = {
  strict: {
    name: "Alex",
    role: "Senior Staff Engineer (Strict & Technical)",
    style:
      "Direct, skeptical. Drills into specific implementation details. Hates surface-level answers.",
    tone: "Professional, demanding, no-nonsense.",
    gender: "male",
  },
  friendly: {
    name: "Sarah",
    role: "Engineering Manager (Supportive)",
    style:
      "Curious about problem-solving approaches. Focuses on 'How' and 'Why'.",
    tone: "Warm, constructive, engaging.",
    gender: "female",
  },
  system: {
    name: "James",
    role: "System Architect",
    style:
      "Focuses on architecture. Asks about database choices, scalability, and trade-offs.",
    tone: "Analytical, thoughtful, detail-oriented.",
    gender: "male",
  },
};

interface ChatRequest {
  message: string;
  resumeId: string;
  history?: { role: string; text: string }[];
  mode?: string;
  difficulty?: string;
  jobDescription?: string;
}

router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const {
      message,
      resumeId,
      history,
      mode = "strict",
      difficulty = "medium",
    } = req.body as ChatRequest;

    if (!message || !resumeId) {
      return res.status(400).json({ error: "Message and resumeId are required" });
    }

    let resumeText = "";
    let jobDescription = "";
    const record = resumeStore.get(resumeId);
    if (!record) {
      return res.status(404).json({ error: "Resume not found. Please re-upload your resume." });
    }
    resumeText = record.content.substring(0, 15000);
    jobDescription = record.jobDescription || "";

    const persona = PERSONAS[mode] || PERSONAS["strict"];

    const jdContext = jobDescription
      ? `\n--- JOB DESCRIPTION ---\n${jobDescription}\n`
      : "";

    const systemPrompt = `
You are '${persona.name}', a ${persona.role}.
You are conducting a high-stakes technical interview in English.

--- RESUME CONTEXT ---
${resumeText}
${jdContext}

--- YOUR BEHAVIOR & RULES ---
1. **Cite Specifics:** Reference the resume and job description explicitly.
   - Bad: "How do you handle state management?"
   - Good: "I see you used Redux Toolkit in your project. Why did you choose that over Context API?"

2. **Coding Challenge (MANDATORY):**
   - After 2-3 theory questions, ask the candidate to write code in the editor.
   - Say: "Let's see how you implement this. Open the editor and write a function to..."
   - Ask them to Run the code and explain the output.

3. **Job Description Alignment:**
   ${jobDescription ? "Match questions to the JD requirements. Test skills mentioned in the job posting." : "Ask relevant technical questions based on the resume."}

4. **Strictness Level: ${difficulty}**
   - If they give vague answers, push for specifics.
   - If they are wrong, correct them.

5. **Response Format:**
   - Keep responses short (2-3 sentences max). This is a voice conversation.
   - Be conversational and natural.
   - Do NOT use markdown formatting, bullet points, or code blocks in your responses.
   - Speak as if you're talking to someone face-to-face.

6. **Style:** ${persona.style}
7. **Tone:** ${persona.tone}

If the user says "Hello" or "Start", introduce yourself as ${persona.name}, mention something specific from their resume, and ask a targeted technical question.
`;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
    });

    const chatHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        chatHistory.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const aiText = result.response.text() || "I'm sorry, could you repeat that?";

    res.json({ reply: aiText, persona: persona.name, gender: persona.gender });
  } catch (error: unknown) {
    console.error("Chat error:", (error as Error).message);
    res.status(500).json({
      error: "AI Service Failed",
      details: (error as Error).message,
    });
  }
});

export default router;
