import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { InterviewResult } from "../services/api";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("interviewResult");
    if (!stored) {
      navigate("/");
      return;
    }
    const parsed: InterviewResult = JSON.parse(stored);
    setResult(parsed);

    // Animate score
    const target = parsed.feedback.overall;
    let current = 0;
    const interval = setInterval(() => {
      current += 0.1;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setAnimatedScore(Math.round(current * 10) / 10);
    }, 30);

    return () => clearInterval(interval);
  }, [navigate]);

  if (!result) return null;

  const { feedback, history, duration, persona, difficulty } = result;

  const radarData = [
    { metric: "Content", value: feedback.content },
    { metric: "Communication", value: feedback.communication },
    { metric: "Behavior", value: feedback.behavior },
    { metric: "Domain", value: feedback.domain },
    { metric: "Technical", value: feedback.technical },
  ];

  const circumference = 2 * Math.PI * 80;
  const strokeOffset = circumference - (animatedScore / 10) * circumference;

  const durationMin = Math.floor((duration || 0) / 60000);
  const durationSec = Math.floor(((duration || 0) % 60000) / 1000);

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <h1>Interview Report</h1>
        <p>
          {persona} interview • {difficulty} level • {durationMin}m {durationSec}s
        </p>
      </div>

      <div className="feedback-grid">
        {/* Score Circle */}
        <div className="score-circle-container panel">
          <div className="score-circle">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C4673A" />
                  <stop offset="100%" stopColor="#D4733F" />
                </linearGradient>
              </defs>
              <circle className="score-circle-bg" cx="90" cy="90" r="80" />
              <circle
                className="score-circle-fill"
                cx="90"
                cy="90"
                r="80"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <div className="score-value">
              <div className="number">{animatedScore}</div>
              <div className="label">out of 10</div>
            </div>
          </div>
          <p
            style={{
              marginTop: "16px",
              color: "var(--text-secondary)",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Overall Performance Score
          </p>
        </div>

        {/* Radar Chart */}
        <div className="radar-container panel">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(120, 100, 75, 0.15)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#6B5F4E", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fill: "#9C8E7A", fontSize: 10 }}
                tickCount={6}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#C4673A"
                fill="#C4673A"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Strengths */}
        <div className="feedback-list strengths panel">
          <h2>💪 Strengths</h2>
          <ul>
            {feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="feedback-list improvements panel">
          <h2>📈 Areas for Improvement</h2>
          <ul>
            {feedback.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <div className="feedback-summary panel">
          <h2>📝 AI Assessment</h2>
          <p style={{ marginBottom: "16px" }}>{feedback.summary}</p>
          <p>{feedback.detailedFeedback}</p>
        </div>

        {/* Transcript */}
        <div className="transcript-section panel">
          <h2>📜 Full Transcript</h2>
          {history.map((msg, i) => (
            <div
              key={i}
              className={`transcript-entry ${msg.role === "assistant" ? "interviewer" : "candidate"}`}
            >
              <div className="role-label">
                {msg.role === "assistant" ? "Aria (Interviewer)" : "You"}
              </div>
              {msg.content}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="feedback-actions">
          <button className="btn-primary" onClick={() => navigate("/")}>
            Start New Interview
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              const text = history
                .map((m) => `${m.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}: ${m.content}`)
                .join("\n\n");
              const blob = new Blob(
                [
                  `AI Interview Pro - Report\n${"=".repeat(40)}\n\nScore: ${feedback.overall}/10\nPersona: ${persona}\nDifficulty: ${difficulty}\n\nStrengths:\n${feedback.strengths.map((s) => `- ${s}`).join("\n")}\n\nImprovements:\n${feedback.improvements.map((s) => `- ${s}`).join("\n")}\n\nSummary:\n${feedback.summary}\n\nDetailed Feedback:\n${feedback.detailedFeedback}\n\n${"=".repeat(40)}\nTranscript\n${"=".repeat(40)}\n\n${text}`,
                ],
                { type: "text/plain" }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "interview-report.txt";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
