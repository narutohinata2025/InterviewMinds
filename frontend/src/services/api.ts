import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export interface ChatResponse {
  reply: string;
  messageCount: number;
}

export interface ResumeUploadResponse {
  resumeId: string;
  filename: string;
  textLength: number;
  preview: string;
}

export interface InterviewResult {
  sessionId: string;
  feedback: {
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
  };
  history: Array<{ role: string; content: string }>;
  duration: number;
  persona: string;
  difficulty: string;
  completedAt: number;
}

export async function uploadResume(file: File): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("resume", file);
  const { data } = await api.post("/resume/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getResumeText(resumeId: string): Promise<string> {
  const { data } = await api.get(`/resume/${resumeId}`);
  return data.text;
}

export async function initSession(
  sessionId: string,
  resumeText: string,
  jobDescription: string,
  persona: string,
  difficulty: string
): Promise<void> {
  await api.post("/chat/init", { sessionId, resumeText, jobDescription, persona, difficulty });
}

export async function sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
  const { data } = await api.post("/chat", { sessionId, message });
  return data;
}

export async function endInterview(sessionId: string): Promise<InterviewResult> {
  const { data } = await api.post("/interview/end", { sessionId });
  return data;
}

export default api;
