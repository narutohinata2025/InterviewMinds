import { ChatMessage } from "./groq";

interface InterviewScore {
  overall: number;
  content: number;
  communication: number;
  behavior: number;
  domain: number;
  technical: number;
  strengths: string[];
  improvements: string[];
  summary: string;
  detailedFeedback: string;
}

export async function generateInterviewFeedback(
  history: ChatMessage[],
  resumeText: string,
  jobDescription: string,
  persona: string,
  difficulty: string
): Promise<InterviewScore> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  const transcript = history
    .map((m) => `${m.role === "user" ? "CANDIDATE" : "INTERVIEWER"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are an expert interview evaluator. Analyze this interview transcript and provide a detailed assessment.

INTERVIEW CONTEXT:
- Persona: ${persona}
- Difficulty: ${difficulty}
- Resume Summary: ${resumeText.substring(0, 1000)}
- Job Description: ${jobDescription.substring(0, 500)}

TRANSCRIPT:
${transcript}

Provide your assessment as a JSON object with EXACTLY this structure (no markdown, no code blocks, just raw JSON):
{
  "overall": <number 0-10>,
  "content": <number 0-10>,
  "communication": <number 0-10>,
  "behavior": <number 0-10>,
  "domain": <number 0-10>,
  "technical": <number 0-10>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "summary": "<2-3 sentence overall assessment>",
  "detailedFeedback": "<detailed paragraph with specific feedback on answers given>"
}

Score descriptions:
- content: Quality and depth of answers, relevance to questions
- communication: Clarity, articulation, ability to explain complex topics
- behavior: Professionalism, composure, problem-solving approach
- domain: Domain-specific knowledge relevant to the job
- technical: Technical accuracy, coding ability, system design thinking

Be fair but honest. Provide actionable feedback.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: any = await response.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Gemini response as JSON");
  }

  const parsed: InterviewScore = JSON.parse(jsonMatch[0]);

  // Ensure all fields exist with defaults
  return {
    overall: Math.min(10, Math.max(0, parsed.overall ?? 5)),
    content: Math.min(10, Math.max(0, parsed.content ?? 5)),
    communication: Math.min(10, Math.max(0, parsed.communication ?? 5)),
    behavior: Math.min(10, Math.max(0, parsed.behavior ?? 5)),
    domain: Math.min(10, Math.max(0, parsed.domain ?? 5)),
    technical: Math.min(10, Math.max(0, parsed.technical ?? 5)),
    strengths: parsed.strengths || ["Good effort"],
    improvements: parsed.improvements || ["Practice more"],
    summary: parsed.summary || "Interview completed.",
    detailedFeedback: parsed.detailedFeedback || "No detailed feedback available.",
  };
}
